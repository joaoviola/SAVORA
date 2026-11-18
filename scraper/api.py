"""
API publica para download de post/reel do Instagram.

Caminho 100% anonimo: nenhuma credencial, nenhum cookie, nenhuma conta.
Usa a extracao validada em baixar_ig.py (pagina de embed).

Arquitetura (espelha o sssinstagram, com as correcoes que eu medi):

  GET /api/extrair?url=...   -> metadados + links internos ASSINADOS
  GET /dl?u=&exp=&sig=       -> faz streaming da CDN com Content-Disposition

Por que o /dl existe: a CDN do Instagram NAO envia Content-Disposition e o
atributo <a download> e ignorado cross-origin. Sem este proxy o navegador
TOCA o video em vez de salvar. Nao e para burlar hotlink -- a URL da CDN ja
vem auto-assinada (oh/oe) e funciona sem Referer.

Rodar:
    uvicorn api:app --host 127.0.0.1 --port 8000
    # producao: defina IG_SEGREDO com um valor forte

    curl "http://127.0.0.1:8000/api/extrair?url=https://www.instagram.com/reel/XXXX/"
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import re
import secrets
import time
from collections import deque
from threading import Lock
from urllib.parse import quote, urlparse

from curl_cffi import requests
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from baixar_ig import IMPERSONATE, REFERER, UA, ErroExtracao, extrair, extrair_shortcode

# --------------------------------------------------------------------------
# config
# --------------------------------------------------------------------------

SEGREDO = os.environ.get("IG_SEGREDO", "").encode() or secrets.token_bytes(32)
if not os.environ.get("IG_SEGREDO"):
    print("AVISO: IG_SEGREDO nao definido -- gerei um efemero. "
          "Links assinados morrem a cada restart e nao funcionam com varios workers.")

TTL_CACHE = 1800              # 30 min de cache de metadados
MARGEM_EXPIRACAO = 600        # nunca servir link a < 10 min da expiracao da CDN
VALIDADE_LINK = 3600          # validade do nosso link interno
LIMITE_REQS = 20              # requisicoes...
LIMITE_JANELA = 60            # ...por janela (segundos), por IP
TAMANHO_MAX = 500 * 1024 * 1024

# Apenas hosts de CDN do Instagram/Meta. Barra SSRF e impede que o /dl
# seja usado como proxy aberto para qualquer URL.
HOSTS_PERMITIDOS = re.compile(r"(?:^|\.)(?:cdninstagram\.com|fbcdn\.net)$")

app = FastAPI(title="Instagram Downloader", version="1.0", docs_url="/docs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("IG_ORIGENS", "*").split(","),
    allow_methods=["GET"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# cache e rate limit (em memoria: vale para 1 processo)
# --------------------------------------------------------------------------

_cache: dict[str, tuple[float, dict]] = {}
_hits: dict[str, deque] = {}
_trava = Lock()


def _expiracao_cdn(url: str) -> float | None:
    """A CDN carrega 'oe=<hex>' com o instante de expiracao da assinatura."""
    m = re.search(r"[?&]oe=([0-9A-Fa-f]+)", url)
    if not m:
        return None
    try:
        return float(int(m.group(1), 16))
    except ValueError:
        return None


def cache_ler(sc: str) -> dict | None:
    with _trava:
        item = _cache.get(sc)
        if not item:
            return None
        expira, payload = item
        if expira < time.time():
            _cache.pop(sc, None)
            return None
        return payload


def cache_gravar(sc: str, payload: dict) -> None:
    """
    TTL limitado pela assinatura da CDN: guardar mais que isso entregaria
    link morto (403) ao usuario.
    """
    limite = time.time() + TTL_CACHE
    for item in payload.get("itens", []):
        oe = _expiracao_cdn(item.get("url", ""))
        if oe:
            limite = min(limite, oe - MARGEM_EXPIRACAO)
    if limite <= time.time():
        return
    with _trava:
        if len(_cache) > 5000:
            _cache.clear()
        _cache[sc] = (limite, payload)


def checar_limite(ip: str) -> None:
    agora = time.time()
    with _trava:
        fila = _hits.setdefault(ip, deque())
        while fila and fila[0] < agora - LIMITE_JANELA:
            fila.popleft()
        if len(fila) >= LIMITE_REQS:
            raise HTTPException(
                429, detail="Muitas requisicoes. Aguarde um instante.",
                headers={"Retry-After": str(LIMITE_JANELA)},
            )
        fila.append(agora)
        if len(_hits) > 10000:
            for k in [k for k, v in _hits.items() if not v]:
                _hits.pop(k, None)


# --------------------------------------------------------------------------
# assinatura dos nossos links
# --------------------------------------------------------------------------

def _b64(dados: bytes) -> str:
    return base64.urlsafe_b64encode(dados).decode().rstrip("=")


def _deb64(txt: str) -> bytes:
    return base64.urlsafe_b64decode(txt + "=" * (-len(txt) % 4))


def assinar(url_cdn: str, exp: int) -> str:
    msg = f"{url_cdn}|{exp}".encode()
    return _b64(hmac.new(SEGREDO, msg, hashlib.sha256).digest())


def link_interno(url_cdn: str, nome: str) -> str:
    exp = int(time.time()) + VALIDADE_LINK
    return (f"/dl?u={quote(_b64(url_cdn.encode()))}"
            f"&exp={exp}&sig={quote(assinar(url_cdn, exp))}&nome={quote(nome)}")


def host_permitido(url: str) -> bool:
    try:
        h = (urlparse(url).hostname or "").lower()
    except ValueError:
        return False
    return bool(h) and bool(HOSTS_PERMITIDOS.search(h))


# --------------------------------------------------------------------------
# rotas
# --------------------------------------------------------------------------

@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True, "cache": len(_cache)}


@app.get("/api/extrair")
def api_extrair(request: Request, url: str = Query(..., max_length=500)) -> dict:
    checar_limite(request.client.host if request.client else "?")

    try:
        sc = extrair_shortcode(url)
    except ErroExtracao:
        raise HTTPException(400, detail="URL de post/reel do Instagram invalida.")

    if (payload := cache_ler(sc)):
        return {**payload, "cache": True}

    try:
        # yt-dlp e lento e puxa processo -- fora do caminho de request
        meta = extrair(url, usar_ytdlp=False)
    except ErroExtracao as e:
        raise HTTPException(
            404,
            detail=f"Nao consegui extrair: {e}. "
                   "Conteudo privado, removido ou apenas para maiores.",
        )

    itens = []
    for n, item in enumerate(meta["itens"], start=1):
        if not host_permitido(item["url"]):
            continue
        ext = ".mp4" if item["tipo"] == "video" else ".jpg"
        sufixo = f"_{n}" if len(meta["itens"]) > 1 else ""
        nome = f"{meta.get('autor') or 'ig'}_{sc}{sufixo}{ext}"
        itens.append({
            "tipo": item["tipo"],
            "nome": nome,
            "download": link_interno(item["url"], nome),
        })

    if not itens:
        raise HTTPException(502, detail="Extracao devolveu midia em host inesperado.")

    payload = {
        "shortcode": sc,
        "autor": meta.get("autor"),
        "tipo": meta.get("tipo"),
        "legenda": (meta.get("legenda") or "")[:2000],
        "itens": itens,
    }
    cache_gravar(sc, payload)
    return {**payload, "cache": False}


@app.get("/dl")
def dl(
    request: Request,
    u: str = Query(..., max_length=2000),
    exp: int = Query(...),
    sig: str = Query(..., max_length=100),
    nome: str = Query("instagram.mp4", max_length=120),
):
    checar_limite(request.client.host if request.client else "?")

    if exp < time.time():
        raise HTTPException(410, detail="Link expirado. Extraia de novo.")
    try:
        url_cdn = _deb64(u).decode()
    except Exception:
        raise HTTPException(400, detail="Parametro invalido.")
    if not hmac.compare_digest(sig, assinar(url_cdn, exp)):
        raise HTTPException(403, detail="Assinatura invalida.")
    # Defesa em profundidade: mesmo assinado, so CDN do Instagram.
    if not host_permitido(url_cdn):
        raise HTTPException(400, detail="Host nao permitido.")

    nome_seguro = re.sub(r"[^\w.\-]", "_", nome)[:120] or "instagram.mp4"

    def fluxo():
        enviados = 0
        with requests.Session(impersonate=IMPERSONATE) as s:
            r = s.get(url_cdn, headers={"User-Agent": UA, "Referer": REFERER,
                                        "Accept": "*/*"},
                      stream=True, timeout=120)
            if r.status_code != 200:
                return
            for bloco in r.iter_content(chunk_size=256 * 1024):
                if not bloco:
                    continue
                enviados += len(bloco)
                if enviados > TAMANHO_MAX:
                    return
                yield bloco

    tipo = "video/mp4" if nome_seguro.endswith(".mp4") else "image/jpeg"
    return StreamingResponse(
        fluxo(),
        media_type=tipo,
        headers={
            # O motivo de existir deste endpoint:
            "Content-Disposition": f'attachment; filename="{nome_seguro}"',
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )


# --------------------------------------------------------------------------
# adaptador para o front-end SAVORA (TanStack Start)
# --------------------------------------------------------------------------
# Contrato definido por src/lib/extract/custom-scraper.server.ts:
#   POST { url, type }  +  Authorization: Bearer <SCRAPER_API_KEY> (opcional)
#   -> { author, caption, items: [{ is_video, video_url, display_url, variants }] }
#
# Devolve URL CRUA da CDN de proposito: o SAVORA ja tem proxy proprio em
# /api/public/file com validacao de host e Content-Disposition. Mandar o
# nosso /dl assinado criaria dois proxies em serie.

from fastapi import Body, Header  # noqa: E402

CHAVE_SCRAPER = os.environ.get("SCRAPER_API_KEY", "")


@app.post("/api/scrape")
def api_scrape(
    request: Request,
    corpo: dict = Body(...),
    authorization: str | None = Header(default=None),
) -> dict:
    if CHAVE_SCRAPER:
        esperado = f"Bearer {CHAVE_SCRAPER}"
        if not authorization or not hmac.compare_digest(authorization, esperado):
            raise HTTPException(401, detail="unauthorized")

    checar_limite(request.client.host if request.client else "?")

    url = (corpo.get("url") or "").strip()
    tipo = (corpo.get("type") or "post").strip()

    # O front-end manda story/highlight tambem; aqui so ha caminho anonimo.
    if tipo in ("story", "highlight"):
        raise HTTPException(422, detail="unsupported")

    try:
        sc = extrair_shortcode(url)
    except ErroExtracao:
        raise HTTPException(400, detail="invalid_url")

    payload = cache_ler("bruto:" + sc)
    if payload is None:
        try:
            meta = extrair(url, usar_ytdlp=False)
        except ErroExtracao as e:
            # O adaptador mapeia 404 -> not_found e 403 -> private.
            msg = str(e).lower()
            if "privad" in msg or "autoral" in msg:
                raise HTTPException(403, detail="private")
            raise HTTPException(404, detail="not_found")

        itens = []
        for item in meta["itens"]:
            if not host_permitido(item["url"]):
                continue
            itens.append({
                "is_video": item["tipo"] == "video",
                "video_url": item["url"] if item["tipo"] == "video" else None,
                "display_url": item.get("thumb") or item["url"],
                "variants": [{"quality": "HD", "url": item["url"]}],
            })
        if not itens:
            raise HTTPException(404, detail="not_found")

        payload = {
            "author": meta.get("autor"),
            "caption": meta.get("legenda") or "",
            "items": itens,
        }
        cache_gravar("bruto:" + sc, {**payload, "itens": meta["itens"]})

    return {k: v for k, v in payload.items() if k != "itens"}


# --------------------------------------------------------------------------
# front-end de demonstracao
# --------------------------------------------------------------------------
# Mount em "/" captura tudo que nao casou antes, inclusive o METODO errado
# (um POST para /api/scrape vira 405 se a rota vier depois daqui).
# Por isso este bloco tem de ser o ULTIMO do arquivo, sempre.
# Opcional: o SAVORA tem o proprio front-end em React.

from fastapi.staticfiles import StaticFiles  # noqa: E402

_WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
if os.path.isdir(_WEB):
    app.mount("/", StaticFiles(directory=_WEB, html=True), name="web")

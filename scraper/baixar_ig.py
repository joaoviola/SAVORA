"""
Extrator de midia publica do Instagram.

Valida a UNICA parte incerta da arquitetura do sssinstagram.com:
resolver uma URL de post/reel em URL de CDN e baixar o arquivo.

Estrategia em camadas:
  1. embed/captioned  -> funciona ANONIMO para conteudo publico (caminho principal)
  2. yt-dlp           -> fallback, mantido pela comunidade

Sobre a CDN (medido, nao suposto): as URLs vem auto-assinadas com
'oh' (HMAC) + 'oe' (expiracao, ~36h). A assinatura e o que autoriza
o acesso -- adulterar 'oh' da 403. Referer NAO e exigido, e CORS e '*'.
Mandamos o Referer por higiene, mas ele nao e load-bearing.

Uso:
    python baixar_ig.py <url> [--out DIR] [--json] [--sem-ytdlp]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from curl_cffi import requests

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
# O header que destrava a CDN. Sem ele, 403.
REFERER = "https://www.instagram.com/"
IMPERSONATE = "chrome"

RE_SHORTCODE = re.compile(r"instagram\.com/(?:[^/]+/)?(?:p|reel|reels|tv)/([A-Za-z0-9_-]+)")


class ErroExtracao(Exception):
    pass


# --------------------------------------------------------------------------
# parsing
# --------------------------------------------------------------------------

def extrair_shortcode(url: str) -> str:
    """Aceita /p/, /reel/, /reels/, /tv/ e tambem o shortcode cru."""
    m = RE_SHORTCODE.search(url)
    if m:
        return m.group(1)
    if re.fullmatch(r"[A-Za-z0-9_-]{5,}", url.strip()):
        return url.strip()
    raise ErroExtracao(f"nao consegui extrair shortcode de: {url!r}")


def _fatiar_literal_json(texto: str, inicio_valor: int) -> str:
    """
    Dado o indice da aspa que abre uma string JSON, devolve o literal
    completo (com as aspas), respeitando escapes de barra invertida.
    """
    if texto[inicio_valor] != '"':
        raise ErroExtracao("esperava aspa abrindo o valor de contextJSON")
    i = inicio_valor + 1
    while i < len(texto):
        c = texto[i]
        if c == "\\":
            i += 2
            continue
        if c == '"':
            return texto[inicio_valor : i + 1]
        i += 1
    raise ErroExtracao("literal de contextJSON nao fechou")


def parsear_context_json(html: str) -> dict:
    """
    A pagina de embed carrega o payload GraphQL como string JSON dentro de
    outro JSON -> precisa de dois json.loads em sequencia.
    """
    chave = '"contextJSON":'
    k = html.find(chave)
    if k == -1:
        raise ErroExtracao("contextJSON ausente (conteudo privado, removido ou login wall)")

    literal = _fatiar_literal_json(html, k + len(chave))
    try:
        camada1 = json.loads(literal)      # literal -> string
        return json.loads(camada1)         # string  -> dict
    except json.JSONDecodeError as e:
        raise ErroExtracao(f"contextJSON malformado: {e}") from e


def _nome_arquivo(url_cdn: str, shortcode: str, indice: int, total: int) -> str:
    ext = ".mp4" if re.search(r"\.mp4(?:\?|$)", url_cdn) else ".jpg"
    sufixo = f"_{indice}" if total > 1 else ""
    return f"{shortcode}{sufixo}{ext}"


def _coletar_midia(no: dict) -> dict:
    """Normaliza um node do GraphQL em {tipo, url, thumb}."""
    poster = no.get("display_url")
    if no.get("is_video") and no.get("video_url"):
        # 'thumb' alimenta o poster do player no front-end
        return {"tipo": "video", "url": no["video_url"], "thumb": poster}
    if poster:
        return {"tipo": "imagem", "url": poster, "thumb": poster}
    raise ErroExtracao("node sem video_url nem display_url")


# --------------------------------------------------------------------------
# camada 1: embed
# --------------------------------------------------------------------------

def buscar_via_embed(shortcode: str) -> dict:
    url = f"https://www.instagram.com/reel/{shortcode}/embed/captioned/"
    r = requests.get(
        url,
        headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"},
        impersonate=IMPERSONATE,
        timeout=30,
    )
    if r.status_code != 200:
        raise ErroExtracao(f"embed devolveu HTTP {r.status_code}")

    ctx = parsear_context_json(r.text)
    media = (ctx.get("gql_data") or {}).get("shortcode_media")
    if not media:
        if (ctx.get("context") or {}).get("copyright_blocked"):
            raise ErroExtracao("bloqueado por direito autoral")
        raise ErroExtracao("shortcode_media ausente no payload")

    legenda = ""
    bordas = (media.get("edge_media_to_caption") or {}).get("edges") or []
    if bordas:
        legenda = (bordas[0].get("node") or {}).get("text", "")

    itens: list[dict] = []
    filhos = (media.get("edge_sidecar_to_children") or {}).get("edges")
    if filhos:  # carrossel
        for borda in filhos:
            itens.append(_coletar_midia(borda["node"]))
    else:
        itens.append(_coletar_midia(media))

    return {
        "fonte": "embed",
        "shortcode": media.get("shortcode", shortcode),
        "id": media.get("id"),
        "tipo": media.get("__typename"),
        "autor": (media.get("owner") or {}).get("username"),
        "legenda": legenda,
        "itens": itens,
    }


# --------------------------------------------------------------------------
# camada 2: yt-dlp
# --------------------------------------------------------------------------

def buscar_via_ytdlp(url_original: str, shortcode: str) -> dict:
    import shutil
    import subprocess

    exe = shutil.which("yt-dlp")
    if not exe:
        raise ErroExtracao("yt-dlp nao encontrado no PATH")

    proc = subprocess.run(
        [exe, "--dump-single-json", "--no-warnings", "--no-playlist", url_original],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if proc.returncode != 0:
        raise ErroExtracao(f"yt-dlp falhou: {(proc.stderr or '').strip()[:300]}")

    d = json.loads(proc.stdout)
    direto = d.get("url")
    if not direto:
        formatos = [f for f in (d.get("formats") or []) if f.get("url")]
        if not formatos:
            raise ErroExtracao("yt-dlp nao devolveu URL de midia")
        direto = formatos[-1]["url"]

    return {
        "fonte": "yt-dlp",
        "shortcode": shortcode,
        "id": d.get("id"),
        "tipo": "video" if d.get("ext") == "mp4" else d.get("ext"),
        "autor": d.get("uploader_id") or d.get("uploader"),
        "legenda": d.get("description") or "",
        "itens": [{"tipo": "video", "url": direto}],
    }


def extrair(url_original: str, usar_ytdlp: bool = True) -> dict:
    shortcode = extrair_shortcode(url_original)
    erros = []
    try:
        return buscar_via_embed(shortcode)
    except Exception as e:
        erros.append(f"embed: {e}")

    if usar_ytdlp:
        try:
            resultado = buscar_via_ytdlp(url_original, shortcode)
            resultado["aviso"] = erros[0]
            return resultado
        except Exception as e:
            erros.append(f"yt-dlp: {e}")

    raise ErroExtracao("todas as camadas falharam -> " + " | ".join(erros))


# --------------------------------------------------------------------------
# download
# --------------------------------------------------------------------------

def baixar(url_cdn: str, destino: Path) -> int:
    """Streaming direto da CDN. A URL ja carrega sua propria assinatura."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    cabecalhos = {
        "User-Agent": UA,
        "Referer": REFERER,          # higiene; a autorizacao real e o 'oh' da URL
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "video",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
    }
    escritos = 0
    with requests.Session(impersonate=IMPERSONATE) as s:
        r = s.get(url_cdn, headers=cabecalhos, stream=True, timeout=120)
        if r.status_code != 200:
            raise ErroExtracao(f"CDN devolveu HTTP {r.status_code} ao baixar")
        with open(destino, "wb") as fh:
            for bloco in r.iter_content(chunk_size=256 * 1024):
                if bloco:
                    fh.write(bloco)
                    escritos += len(bloco)
    if escritos == 0:
        destino.unlink(missing_ok=True)
        raise ErroExtracao("arquivo vazio")
    return escritos


# --------------------------------------------------------------------------
# cli
# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Baixa midia publica do Instagram.")
    ap.add_argument("url", help="URL do post/reel ou o shortcode")
    ap.add_argument("--out", default="downloads", help="pasta de destino")
    ap.add_argument("--json", action="store_true", help="imprime metadados e nao baixa")
    ap.add_argument("--sem-ytdlp", dest="sem_ytdlp", action="store_true",
                    help="desativa o fallback do yt-dlp")
    args = ap.parse_args()

    try:
        meta = extrair(args.url, usar_ytdlp=not args.sem_ytdlp)
    except ErroExtracao as e:
        print(f"ERRO: {e}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(meta, ensure_ascii=False, indent=2))
        return 0

    print(f"fonte   : {meta['fonte']}")
    print(f"autor   : @{meta.get('autor')}")
    print(f"tipo    : {meta.get('tipo')}  ({len(meta['itens'])} item(ns))")
    if meta.get("aviso"):
        print(f"aviso   : {meta['aviso']}")

    pasta = Path(args.out)
    total = len(meta["itens"])
    falhas = 0
    for n, item in enumerate(meta["itens"], start=1):
        nome = _nome_arquivo(item["url"], meta["shortcode"], n, total)
        alvo = pasta / nome
        try:
            tamanho = baixar(item["url"], alvo)
            print(f"  OK  {nome}  ({tamanho/1_048_576:.2f} MB)")
        except ErroExtracao as e:
            falhas += 1
            print(f"  FALHA  {nome}: {e}", file=sys.stderr)

    return 1 if falhas else 0


if __name__ == "__main__":
    raise SystemExit(main())

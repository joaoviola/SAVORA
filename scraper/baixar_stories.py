"""
Camada autenticada: stories e highlights do Instagram.

Stories e highlights NAO tem caminho anonimo -- o embed publico usado em
baixar_ig.py nao os cobre. Aqui a sessao vem de cookies que VOCE exporta
do seu proprio navegador ja logado. Nenhuma senha e tocada por este script.

Como obter o cookies.txt:
  a) yt-dlp faz sozinho (lida com a App-Bound Encryption do Chrome no Windows):
       yt-dlp --cookies-from-browser chrome --cookies cookies.txt \
              --skip-download "https://www.instagram.com/instagram/"
     ou simplesmente:  python baixar_stories.py <user> --do-navegador chrome
  b) extensao "Get cookies.txt LOCALLY" com instagram.com aberto e logado.

Uso:
    python baixar_stories.py <username|url> [--cookies cookies.txt]
    python baixar_stories.py <username> --highlights
    python baixar_stories.py <username> --listar
    python baixar_stories.py <username> --do-navegador chrome

Avisos:
  - A sessao e tratada como segredo: valores de cookie nunca sao impressos.
  - Usar a propria conta para raspagem automatizada e o que faz a conta
    ser banida. Use conta descartavel e ritmo humano.
  - So alcanca o que a SUA conta ja pode ver. Perfil privado que voce nao
    segue continua inacessivel.
"""

from __future__ import annotations

import argparse
import http.cookiejar
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from curl_cffi import requests

from baixar_ig import IMPERSONATE, UA, ErroExtracao, baixar

APP_ID = "936619743392459"
BASE = "https://www.instagram.com"
COOKIES_OBRIGATORIOS = ("sessionid", "csrftoken", "ds_user_id")

RE_USER_URL = re.compile(r"instagram\.com/(?:stories/)?([A-Za-z0-9._]+)")


class ErroSessao(ErroExtracao):
    """Falha de autenticacao -- cookie ausente, expirado ou sem permissao."""


# --------------------------------------------------------------------------
# sessao
# --------------------------------------------------------------------------

def exportar_do_navegador(navegador: str, destino: Path) -> Path:
    """Delega ao yt-dlp, que sabe descriptografar o cookie store do Chrome."""
    import shutil

    exe = shutil.which("yt-dlp")
    if not exe:
        raise ErroSessao("yt-dlp nao encontrado no PATH")

    print(f"extraindo cookies do {navegador} via yt-dlp...", file=sys.stderr)

    # O yt-dlp despeja o jar INTEIRO do navegador (todos os dominios).
    # Escrevemos num temporario, filtramos so o Instagram e apagamos o resto --
    # nao deixamos cookie de banco/email parado em disco.
    bruto = destino.with_suffix(".bruto.tmp")
    try:
        proc = subprocess.run(
            [exe, "--cookies-from-browser", navegador, "--cookies", str(bruto),
             "--skip-download", "--no-warnings", f"{BASE}/instagram/"],
            capture_output=True, text=True, timeout=180,
        )
        if not bruto.exists():
            raise ErroSessao(
                f"nao consegui exportar cookies do {navegador}: "
                f"{(proc.stderr or '').strip()[:300]}"
            )

        mantidas, descartadas = [], 0
        for linha in bruto.read_text(encoding="utf-8", errors="replace").splitlines():
            if linha.startswith("#") or not linha.strip():
                mantidas.append(linha)
            elif "instagram.com" in linha.split("\t")[0]:
                mantidas.append(linha)
            else:
                descartadas += 1

        destino.write_text("\n".join(mantidas) + "\n", encoding="utf-8")
        print(f"filtrado: {descartadas} cookies de outros dominios descartados",
              file=sys.stderr)
    finally:
        bruto.unlink(missing_ok=True)

    return destino


def carregar_cookies(caminho: Path) -> dict[str, str]:
    """Le um cookies.txt no formato Netscape e filtra o dominio do Instagram."""
    if not caminho.exists():
        raise ErroSessao(f"arquivo de cookies nao encontrado: {caminho}")

    jar = http.cookiejar.MozillaCookieJar(str(caminho))
    try:
        jar.load(ignore_discard=True, ignore_expires=True)
    except http.cookiejar.LoadError as e:
        raise ErroSessao(f"cookies.txt invalido ({e}); confira o formato Netscape") from e

    cookies: dict[str, str] = {}
    agora = time.time()
    expirados: list[str] = []
    for c in jar:
        if "instagram.com" not in (c.domain or ""):
            continue
        if c.expires and c.expires < agora:
            expirados.append(c.name)
            continue
        cookies[c.name] = c.value

    faltando = [n for n in COOKIES_OBRIGATORIOS if n not in cookies]
    if faltando:
        extra = f" (expirados: {', '.join(expirados)})" if expirados else ""
        raise ErroSessao(
            f"cookies obrigatorios ausentes: {', '.join(faltando)}{extra}. "
            "Faca login no instagram.com no navegador e exporte de novo."
        )
    return cookies


def montar_sessao(cookies: dict[str, str]) -> requests.Session:
    s = requests.Session(impersonate=IMPERSONATE)
    for nome, valor in cookies.items():
        s.cookies.set(nome, valor, domain=".instagram.com")
    s.headers.update({
        "User-Agent": UA,
        "x-ig-app-id": APP_ID,
        "x-csrftoken": cookies["csrftoken"],
        "x-requested-with": "XMLHttpRequest",
        "Referer": f"{BASE}/",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    })
    return s


def _get_json(s: requests.Session, url: str, oque: str, erro_404: str | None = None) -> dict:
    r = s.get(url, timeout=30)
    if r.status_code in (401, 403):
        raise ErroSessao(
            f"{oque}: HTTP {r.status_code} -- sessao invalida/expirada ou sem permissao"
        )
    if r.status_code == 429:
        raise ErroSessao(f"{oque}: HTTP 429 -- rate limit. Pare e espere.")
    if r.status_code == 404:
        # Cuidado: o Instagram usa 404 (nao 401) como gate de sessao em
        # varios endpoints -- 404 aqui raramente significa "nao existe".
        if erro_404:
            raise ErroSessao(f"{oque}: {erro_404}")
        raise ErroExtracao(f"{oque}: HTTP 404 -- nao existe")
    if r.status_code != 200:
        raise ErroExtracao(f"{oque}: HTTP {r.status_code}")
    try:
        return r.json()
    except Exception as e:
        if "login" in r.text[:2000].lower():
            raise ErroSessao(f"{oque}: recebi login wall em vez de JSON") from e
        raise ErroExtracao(f"{oque}: resposta nao e JSON") from e


# --------------------------------------------------------------------------
# resolucao
# --------------------------------------------------------------------------

def extrair_username(entrada: str) -> str:
    entrada = entrada.strip().lstrip("@")
    if "instagram.com" in entrada:
        m = RE_USER_URL.search(entrada)
        if not m:
            raise ErroExtracao(f"nao achei username em: {entrada!r}")
        return m.group(1)
    if re.fullmatch(r"[A-Za-z0-9._]{1,30}", entrada):
        return entrada
    raise ErroExtracao(f"username invalido: {entrada!r}")


def resolver_user_id(s: requests.Session, username: str) -> str:
    url = f"{BASE}/api/v1/users/web_profile_info/?username={username}"
    d = _get_json(
        s, url, f"perfil @{username}",
        erro_404=("HTTP 404. Este endpoint responde 404 quando a sessao nao vale, "
                  "entao a causa provavel e cookie invalido/expirado -- e nao "
                  "username inexistente. Confira o @ e reexporte os cookies."),
    )
    user = (d.get("data") or {}).get("user")
    if not user:
        raise ErroExtracao(f"@{username} nao encontrado")
    if user.get("is_private") and not user.get("followed_by_viewer"):
        raise ErroSessao(f"@{username} e privado e sua conta nao segue")
    return user["id"]


def _melhor(candidatos: list[dict]) -> str:
    """Escolhe a maior resolucao disponivel."""
    validos = [c for c in candidatos if c.get("url")]
    if not validos:
        raise ErroExtracao("nenhuma URL de midia no item")
    return max(validos, key=lambda c: (c.get("width") or 0) * (c.get("height") or 0))["url"]


def normalizar_item(item: dict) -> dict:
    tipo_bruto = item.get("media_type")
    if tipo_bruto == 2:
        versoes = item.get("video_versions") or []
        url = _melhor(versoes)
        tipo = "video"
    else:
        versoes = ((item.get("image_versions2") or {}).get("candidates")) or []
        url = _melhor(versoes)
        tipo = "imagem"

    ts = item.get("taken_at")
    quando = (
        datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y%m%d_%H%M%S")
        if ts else "sem_data"
    )
    return {
        "pk": str(item.get("pk") or item.get("id") or "?"),
        "tipo": tipo,
        "url": url,
        "quando": quando,
        "expira_em": item.get("expiring_at"),
    }


def buscar_stories(s: requests.Session, user_id: str, username: str) -> list[dict]:
    url = f"{BASE}/api/v1/feed/reels_media/?reel_ids={user_id}"
    d = _get_json(s, url, f"stories de @{username}")
    bandejas = d.get("reels_media") or []
    if not bandejas:
        return []
    return [normalizar_item(i) for i in (bandejas[0].get("items") or [])]


def buscar_highlights(s: requests.Session, user_id: str, username: str) -> list[dict]:
    url = f"{BASE}/api/v1/highlights/{user_id}/highlights_tray/"
    d = _get_json(s, url, f"highlights de @{username}")
    bandeja = d.get("tray") or []

    tudo: list[dict] = []
    for h in bandeja:
        hid = h.get("id")  # formato "highlight:1790..."
        titulo = h.get("title") or "sem_titulo"
        if not hid:
            continue
        u = f"{BASE}/api/v1/feed/reels_media/?reel_ids={hid}"
        try:
            d2 = _get_json(s, u, f"highlight {titulo!r}")
        except ErroExtracao as e:
            print(f"  aviso: highlight {titulo!r} falhou ({e})", file=sys.stderr)
            continue
        for bandeja2 in (d2.get("reels_media") or []):
            for item in (bandeja2.get("items") or []):
                n = normalizar_item(item)
                n["highlight"] = re.sub(r"[^\w-]+", "_", titulo)[:40]
                tudo.append(n)
        time.sleep(1.5)  # ritmo humano: nao queime a conta
    return tudo


# --------------------------------------------------------------------------
# cli
# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Baixa stories/highlights com sessao propria.")
    ap.add_argument("alvo", help="username, @username ou URL do perfil")
    ap.add_argument("--cookies", default="cookies.txt", help="cookies.txt (Netscape)")
    ap.add_argument("--do-navegador", dest="navegador", default=None,
                    metavar="NAVEGADOR",
                    help="exporta cookies do navegador (chrome, firefox, edge, brave)")
    ap.add_argument("--highlights", action="store_true", help="pega highlights")
    ap.add_argument("--listar", action="store_true", help="so lista, nao baixa")
    ap.add_argument("--out", default="downloads/stories", help="pasta de destino")
    args = ap.parse_args()

    caminho = Path(args.cookies)
    try:
        if args.navegador:
            exportar_do_navegador(args.navegador, caminho)
        cookies = carregar_cookies(caminho)
        username = extrair_username(args.alvo)
        s = montar_sessao(cookies)

        # flush=True: sem isto o stdout bufferizado sai depois do stderr
        # e os erros aparecem antes das linhas de diagnostico.
        print(f"sessao  : ds_user_id={cookies['ds_user_id']} (cookies ok)", flush=True)
        user_id = resolver_user_id(s, username)
        print(f"alvo    : @{username} (id {user_id})", flush=True)

        itens = (buscar_highlights(s, user_id, username) if args.highlights
                 else buscar_stories(s, user_id, username))
    except ErroSessao as e:
        print(f"ERRO DE SESSAO: {e}", file=sys.stderr)
        return 2
    except ErroExtracao as e:
        print(f"ERRO: {e}", file=sys.stderr)
        return 1

    if not itens:
        print("nada ativo agora (stories duram 24h).")
        return 0

    print(f"itens   : {len(itens)}")
    if args.listar:
        for it in itens:
            marca = f"[{it['highlight']}] " if it.get("highlight") else ""
            print(f"  {marca}{it['quando']}  {it['tipo']:7}  pk={it['pk']}")
        return 0

    pasta = Path(args.out)
    falhas = 0
    for it in itens:
        ext = ".mp4" if it["tipo"] == "video" else ".jpg"
        prefixo = f"{it['highlight']}_" if it.get("highlight") else ""
        nome = f"{username}_{prefixo}{it['quando']}_{it['pk']}{ext}"
        try:
            tamanho = baixar(it["url"], pasta / nome)
            print(f"  OK  {nome}  ({tamanho/1_048_576:.2f} MB)")
        except ErroExtracao as e:
            falhas += 1
            print(f"  FALHA  {nome}: {e}", file=sys.stderr)
        time.sleep(1.0)

    return 1 if falhas else 0


if __name__ == "__main__":
    raise SystemExit(main())

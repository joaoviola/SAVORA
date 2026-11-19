"""
Sobe o Worker Hub e o túnel ngrok num só processo.

Porque num só processo: com o cloudflared eram dois processos
independentes, e quando o túnel morria o serviço continuava de pé a
fingir que estava tudo bem. Aqui, se o túnel cai, cai tudo -- o estado
é honesto e o `hub.json` deixa de apontar para um fantasma.

Porque ngrok e não cloudflared: o plano gratuito do ngrok dá um
domínio estático. O `trycloudflare` gera um endereço novo a cada
arranque e a Cloudflare recicla os inativos, o que foi exatamente o
que partiu isto antes.

Configurar (em scraper/.env, nunca no chat nem no repositório):

    NGROK_AUTHTOKEN=<o-token-do-painel-ngrok>
    NGROK_DOMAIN=<o-seu-dominio>.ngrok-free.app   # opcional mas recomendado
    SCRAPER_API_KEY=<a-chave-que-o-SAVORA-envia>

Correr:

    python subir.py

Sem NGROK_AUTHTOKEN sobe só o serviço local, sem túnel.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

PORTA = int(os.environ.get("PORT", "8000"))


def carregar_env() -> None:
    """Lê scraper/.env sem dependências extras."""
    f = Path(__file__).with_name(".env")
    if not f.exists():
        return
    for linha in f.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        os.environ.setdefault(chave.strip(), valor.strip().strip("\"'"))


def abrir_tunel() -> str | None:
    token = os.environ.get("NGROK_AUTHTOKEN", "").strip()
    if not token:
        print("NGROK_AUTHTOKEN ausente -- a subir apenas em local, sem tunel.",
              file=sys.stderr)
        return None

    import ngrok

    dominio = os.environ.get("NGROK_DOMAIN", "").strip()
    opcoes: dict = {"authtoken": token}
    if dominio:
        opcoes["domain"] = dominio

    try:
        ouvinte = ngrok.forward(PORTA, **opcoes)
    except Exception as e:
        # Domínio errado ou já em uso é o erro comum: vale tentar sem ele
        # em vez de deixar o serviço sem túnel nenhum.
        if dominio:
            print(f"falhou com o dominio {dominio!r} ({e}); a tentar sem dominio fixo...",
                  file=sys.stderr)
            ouvinte = ngrok.forward(PORTA, authtoken=token)
        else:
            raise

    url = ouvinte.url()
    print(f"\n  tunel ativo : {url}")
    print(f"  endpoint    : {url}/api/scrape")
    print(f"  diagnostico : {url}/api/diag")
    if not dominio:
        print("\n  AVISO: sem NGROK_DOMAIN o endereco muda a cada arranque.")
        print("  Reserve o dominio gratuito no painel do ngrok e ponha-o no .env.")
    print(f"\n  Agora ponha este URL em scraper/hub.json:\n    {url}/api/scrape\n")
    return url


def main() -> int:
    carregar_env()
    if not os.environ.get("SCRAPER_API_KEY"):
        print("AVISO: SCRAPER_API_KEY ausente -- o endpoint fica ABERTO a qualquer um "
              "que descubra o URL do tunel.", file=sys.stderr)

    abrir_tunel()

    import uvicorn

    # host 0.0.0.0 para o ngrok alcancar; o tunel e que expoe, nao a LAN.
    uvicorn.run("api:app", host="0.0.0.0", port=PORTA, log_level="warning")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

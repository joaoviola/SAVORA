"""
Formulário de configuração do túnel ngrok.

Pede o authtoken com entrada oculta, valida-o contra o ngrok e grava em
`scraper/.env`. O token nunca é impresso, nem fica no histórico do shell
— que é o que aconteceria com `NGROK_AUTHTOKEN=xxx python subir.py`.

    python configurar_ngrok.py

No fim diz se o túnel abre e qual o endereço público.
"""

from __future__ import annotations

import getpass
import os
import sys
from pathlib import Path

ENV = Path(__file__).with_name(".env")


def ler_env() -> dict[str, str]:
    if not ENV.exists():
        return {}
    dados: dict[str, str] = {}
    for linha in ENV.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if linha and not linha.startswith("#") and "=" in linha:
            k, v = linha.split("=", 1)
            dados[k.strip()] = v.strip().strip("\"'")
    return dados


def gravar_env(dados: dict[str, str]) -> None:
    """Reescreve o .env preservando o que já lá estava."""
    linhas = [f"{k}={v}" for k, v in dados.items() if v]
    ENV.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"\n  gravado em {ENV.name} ({len(linhas)} variaveis)")


def pedir(rotulo: str, atual: str, oculto: bool, obrigatorio: bool) -> str:
    tem = "definido" if atual else "vazio"
    sufixo = " (Enter mantem o atual)" if atual else ""
    print(f"\n{rotulo}")
    print(f"  estado atual: {tem}{sufixo}")
    while True:
        valor = (getpass.getpass("  > ") if oculto else input("  > ")).strip()
        if valor:
            return valor
        if atual:
            return atual
        if not obrigatorio:
            return ""
        print("  obrigatorio — cole o valor ou Ctrl+C para sair.")


def main() -> int:
    print("=" * 62)
    print("  Configuracao do tunel ngrok — Worker Hub do SAVORA")
    print("=" * 62)
    print("\n  Onde obter:")
    print("   - authtoken : painel ngrok -> Getting Started -> Your Authtoken")
    print("   - dominio   : painel ngrok -> Domains -> Create Domain")
    print("                 (o plano gratuito da 1 dominio estatico;")
    print("                  sem ele o endereco muda a cada arranque)")

    dados = ler_env()

    try:
        dados["NGROK_AUTHTOKEN"] = pedir(
            "NGROK_AUTHTOKEN  (a escrita fica oculta)",
            dados.get("NGROK_AUTHTOKEN", ""), oculto=True, obrigatorio=True)
        dados["NGROK_DOMAIN"] = pedir(
            "NGROK_DOMAIN  (ex: algo-aleatorio.ngrok-free.app — opcional)",
            dados.get("NGROK_DOMAIN", ""), oculto=False, obrigatorio=False)
    except KeyboardInterrupt:
        print("\n\n  cancelado — nada foi gravado.")
        return 1

    if not dados.get("SCRAPER_API_KEY"):
        import secrets
        dados["SCRAPER_API_KEY"] = secrets.token_urlsafe(32)
        print("\n  SCRAPER_API_KEY nao existia — gerei uma nova.")

    gravar_env(dados)

    # ---- validar contra o ngrok ----
    print("\n  a validar o token com o ngrok...")
    os.environ["NGROK_AUTHTOKEN"] = dados["NGROK_AUTHTOKEN"]
    try:
        import ngrok
    except ImportError:
        print("  SDK ngrok nao instalado. Corra:  pip install ngrok")
        return 1

    opcoes: dict = {"authtoken": dados["NGROK_AUTHTOKEN"]}
    if dados.get("NGROK_DOMAIN"):
        opcoes["domain"] = dados["NGROK_DOMAIN"]
    try:
        ouvinte = ngrok.forward(8000, **opcoes)
    except Exception as e:
        msg = str(e)
        print(f"\n  FALHOU: {msg[:300]}")
        if dados.get("NGROK_DOMAIN") and "domain" in msg.lower():
            print("\n  O token parece bom mas o dominio foi recusado.")
            print("  Confirme o nome exato no painel, ou apague a linha")
            print("  NGROK_DOMAIN do .env para usar endereco rotativo.")
        else:
            print("\n  Token invalido ou sem rede. Copie-o outra vez do painel.")
        return 1

    url = ouvinte.url()
    print("\n" + "=" * 62)
    print(f"  TUNEL OK : {url}")
    print(f"  endpoint : {url}/api/scrape")
    print("=" * 62)
    print("\n  Mande este endereco ao Claude — ele poe no hub.json.")
    print("  (o endereco e publico; o token e a chave nao saem daqui)")
    print("\n  Para subir o servico:  python subir.py")
    try:
        ngrok.disconnect(url)
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

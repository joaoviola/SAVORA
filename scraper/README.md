# scraper — Worker Hub do SAVORA

Serviço Python que entra **quando a extração no servidor do SAVORA falha**.

É o segundo elo da cadeia `[instagramEmbed, customScraper]`. O primeiro corre
dentro do app; quando o Instagram o bloqueia, o `customScraper` chama este
serviço em `SCRAPER_URL`.

```
[Utilizador]
   │ cola link
   ▼
[Servidor SAVORA] ── tenta instagramEmbed ── sucesso ──► devolve
   │ bloqueado
   ▼
[este serviço]  curl_cffi a imitar Chrome (TLS real)
   │ devolve JSON com URL crua da CDN
   ▼
[Servidor SAVORA] ── /api/public/file?u=… ──► utilizador descarrega
```

## Porquê um serviço separado

Não é redundância: é o mesmo desenho do sssInstagram, onde o site em Laravel
nunca toca o Instagram e um `api-wh` separado faz a recolha. O IP que raspa
é o que apanha bloqueio, por isso tem de ser substituível sem mexer no site.

E há uma vantagem concreta: **o IP residencial funciona onde o de datacenter
falha**. Com UA de navegador o Instagram devolve uma login wall de ~537 KB
sem `contextJSON`; a partir de uma ligação doméstica, com `curl_cffi` a
imitar o TLS do Chrome, vêm ~252 KB com o conteúdo real. Expor esta máquina
por túnel é, muitas vezes, melhor do que alojar na nuvem.

---

## Correr

```bash
cd scraper
pip install -r requirements.txt
export SCRAPER_API_KEY="um-valor-forte"
uvicorn api:app --host 127.0.0.1 --port 8000
```

### Expor publicamente

Com qualquer um destes, o URL gerado é o que vai para `SCRAPER_URL`:

```bash
# Cloudflare Tunnel — gratuito, sem conta para testes
cloudflared tunnel --url http://localhost:8000
```

```bash
# ngrok
ngrok http 8000
```

Num VPS, dispense o túnel e ponha atrás de nginx com TLS.

### Ligar ao app

No ambiente do SAVORA (Lovable → Settings → Environment Variables):

```
SCRAPER_URL=https://<o-seu-tunel>/api/scrape
SCRAPER_API_KEY=o-mesmo-valor-forte
```

Sem `SCRAPER_URL`, o `customScraper` devolve `not_configured` e não há
segunda tentativa.

---

## Contrato

`POST /api/scrape` — exatamente o que `custom-scraper.server.ts` envia.

```jsonc
// pedido
{ "url": "https://www.instagram.com/reel/XXXX/", "type": "reel" }
// header: Authorization: Bearer <SCRAPER_API_KEY>
```

```jsonc
// resposta
{
  "author": "nasa",
  "caption": "…",
  "items": [{
    "is_video": true,
    "video_url": "https://scontent-….cdninstagram.com/….mp4",
    "display_url": "https://scontent-….cdninstagram.com/….jpg",
    "variants": [{ "quality": "HD", "url": "https://….mp4" }]
  }]
}
```

URLs **cruas da CDN**, de propósito: o app já as embrulha em
`/api/public/file`, que valida o host e põe o `Content-Disposition`.

| HTTP | vira no app |
|---|---|
| 400 | `invalid_url` |
| 403 | `private` |
| 404 | `not_found` |
| 422 | story/highlight — chega como `upstream` (o adaptador só mapeia 404/403) |
| 429 | limite por IP |

---

## Verificado

Testado ponta a ponta com o `customScraper` real do app a chamar este
serviço: devolveu `@nasa`, `kind=video`, URL de CDN e thumbnail. Shortcode
inexistente deu `not_found`; chave errada foi recusada.

| Conteúdo | |
|---|---|
| Post, Reel, IGTV público | ✅ |
| Carrossel | ✅ |
| Story / Highlight | ❌ exigem sessão autenticada |
| Perfil privado | ❌ |

---

## Diagnóstico

Antes de culpar este serviço, veja o que o servidor do SAVORA recebe:

```
https://<o-seu-dominio>/api/public/diag
```

`hasContext: true` em alguma tentativa = o servidor extrai sozinho e este
serviço nem é preciso. Todas `false` com `length` grande = o IP do servidor
apanha login wall, e é exatamente para isso que este serviço existe.

---

## Produção

- Defina `SCRAPER_API_KEY`; sem ela o endpoint fica aberto a qualquer um.
- Cache e limite de pedidos são em memória (1 processo). Com réplicas, Redis.
- Se o túnel cair, o app volta a depender só do `instagramEmbed` — degrada,
  não parte.

Extras: `GET /api/extrair` + `GET /dl` são uma API autónoma com links
assinados e um front-end de teste em `web/`, úteis para validar o extrator
isolado. `baixar_ig.py` é o CLI. `baixar_stories.py` cobre stories com
cookies exportados do **seu** navegador — uso local apenas; sessão pessoal
num servidor é um token da conta exposto e banimento por volume.

`../docs/analise-sssinstagram.json` traz a engenharia reversa que originou
este desenho.

# Ligar o extrator do Instagram ao SAVORA

O site fica igual. Muda só o que acontece por trás quando alguém cola um link e carrega em Download.

## O que muda
- A lógica dos seus ficheiros (`baixar_ig.py` + `api.py`) passa a correr dentro do próprio SAVORA. Não é preciso alojar o servidor Python à parte.
- Não há rotas públicas novas. A extração corre só dentro da função interna que o botão Download já usa. O endereço do Instagram e o método nunca chegam ao navegador.
- Posts, Reels, vídeos e carrosséis passam a funcionar (conteúdo público).
- Stories e Destaques continuam a mostrar "não suportado", tal como o seu `api.py` faz (precisam de sessão iniciada).
- O ficheiro sai com o nome `autor_codigo_N.mp4/.jpg`, como no seu script.

## Como funciona (igual ao seu Python)
1. Tirar o código curto do link (`/p/`, `/reel/`, `/reels/`, `/tv/`).
2. Abrir `instagram.com/reel/<código>/embed/captioned/` com User-Agent do Chrome.
3. Ler `contextJSON` (JSON dentro de JSON, duas leituras) → `gql_data.shortcode_media`.
4. Carrossel: `edge_sidecar_to_children`; senão o próprio item. Vídeo usa `video_url`, imagem `display_url`.
5. Erros: sem `contextJSON` → privado/removido; `copyright_blocked` → privado; outros → não encontrado.
6. Só aceitar ficheiros de `cdninstagram.com` / `fbcdn.net`.
7. Cache em memória por código, com validade limitada pelo `oe=` da CDN (menos 10 min de margem), máximo 30 min.

## Detalhes técnicos
- Novo `src/lib/extract/instagram-embed.server.ts` implementando `Extractor` (porte em TS de `buscar_via_embed`, `parsear_context_json`, `_coletar_midia`, cache e `oe`).
- `engine.server.ts`: `extractors = [instagramEmbed, customScraper]`; o scraper externo só é usado como reserva se `SCRAPER_URL` existir e o embed falhar.
- `extract.functions.ts`: percorrer a lista de extratores em vez de usar só o primeiro. Rate limit existente mantém-se.
- `/api/public/file` (já existente, com lista de hosts): enviar `User-Agent` + `Referer: https://www.instagram.com/`, aceitar `?name=` sanitizado para o nome do ficheiro e limite de 500 MB. Sem novas rotas.
- Fallback yt-dlp não é portado (exige processo externo, que o servidor não permite).
- Testes: `instagram-embed.test.ts` com HTML de exemplo — item único, carrossel, `copyright_blocked`, `contextJSON` ausente, host não permitido, cálculo do `oe`.

## Risco a confirmar
O Python usa `curl_cffi` para imitar a "impressão digital" do Chrome. O servidor do SAVORA não consegue fazer isso. Se o Instagram bloquear os pedidos sem essa imitação, a alternativa é alojar o seu `api.py` noutro serviço e eu ligo o SAVORA a ele pelo `/api/scrape`, que já é compatível. Testo com um link real logo depois de implementar.

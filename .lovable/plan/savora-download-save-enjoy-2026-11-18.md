# SAVORA — Download. Save. Enjoy.

Downloader de Instagram bilingue (EN/PT), com marca própria, SEO internacional e app instalável que abre sem internet.

## Marca e design
- Logótipo SVG original (monograma "S" com seta de download) e favicon/ícones da app a partir dele.
- Fundo branco, uma cor de marca forte (coral profundo) + tinta quase preta; tipografia "Space Grotesk" (títulos) + "IBM Plex Sans" (texto).
- Cantos discretos, sem gradientes exagerados, sem animações supérfluas.
- Toda a marca Lovable removida: título, descrições, favicon, autor, twitter.

## Idiomas e páginas
- `/` redireciona para `/en` ou `/pt` conforme o idioma do navegador.
- Seletor de idioma no cabeçalho; tudo traduzido (menus, botões, FAQ, SEO).
- Em cada idioma:
  - Início (cabeçalho, título principal, campo de link + Download, categorias, 3 passos, vantagens, secções de cada downloader, FAQ, texto informativo, rodapé)
  - 6 páginas dedicadas: Vídeo, Fotos, Reels, Stories, Destaques, Carrossel (URLs traduzidos, ex. `/pt/baixar-reels-instagram`)
  - Legais: Privacidade, Termos, Sobre, Contacto, Direitos de autor/remoção
- Aviso claro: plataforma independente, sem ligação ao Instagram ou à Meta.

## Download
- Valida o link e deteta o tipo (post, reel, story, destaque, carrossel).
- Pede ao seu scraper, mostra pré-visualizações, opções de qualidade e botão de download por item (carrossel: todos os itens).
- Mensagens claras para conteúdo privado, apagado ou não suportado.
- Nada simulado: enquanto o seu scraper não estiver ligado, aparece "serviço temporariamente indisponível".
- Limite de pedidos por visitante.

## SEO
- Título/descrição únicos por página e idioma, canonical + hreflang (en, pt, x-default), Open Graph e Twitter.
- Dados estruturados: WebApplication, FAQPage, BreadcrumbList.
- `sitemap.xml` com todas as páginas nos dois idiomas, `robots.txt` atualizado.
- Ligações internas entre as páginas dedicadas; espaço preparado para Search Console e Analytics.

## App instalável + offline
- Manifesto com nome, cores e ícones SAVORA.
- Páginas abrem sem internet na versão publicada (não na pré-visualização); download continua a precisar de rede, com aviso.

## Detalhes técnicos
- Rotas `src/routes/$lang/...` com validação `en|pt`; dicionários em `src/i18n/{en,pt}.ts`; slugs traduzidos num mapa partilhado para hreflang.
- Extração: `createServerFn` → `src/server/extract/` com interface `Extractor` e adaptador `customScraper` que normaliza o JSON para `{type, author, items:[{kind, thumbnail, variants:[{quality,url}]}]}`. Lê `SCRAPER_URL` e `SCRAPER_API_KEY` (segredos, pedidos quando enviar o formato). Mapeamento ajustado ao seu exemplo de JSON.
- Rota `/api/public/file` para descarregar via proxy com `Content-Disposition` (só domínios de CDN do Instagram permitidos).
- Rate limit em memória por IP (simples; pode passar para Lovable Cloud depois).
- PWA com `vite-plugin-pwa` (generateSW, NetworkFirst para páginas, registo protegido contra pré-visualização, `?sw=off`).
- `sitemap[.]xml.tsx` como rota de servidor; testes para validação de URL e deteção de tipo.

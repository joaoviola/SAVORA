# Configurar a ligação ao Worker Hub (sem mexer no código)

## O que vou fazer
1. Abrir o formulário seguro para pedir dois valores:
   - `SCRAPER_URL` — endereço completo do seu Worker Hub (ex.: `https://.../api/scrape`)
   - `SCRAPER_API_KEY` — a chave que o Worker Hub espera no cabeçalho `Authorization: Bearer ...`
2. Confirmar que ficam disponíveis no servidor: chamar a função de download com um link real do Instagram e verificar nos registos do servidor que o pedido chega ao Worker Hub (sem nunca mostrar os valores).

## O que não muda
- Nenhum ficheiro de código nem o visual do site.
- O extrator direto continua a ser tentado primeiro; o Worker Hub só é usado quando ele falha.

## Nota
Os valores nunca passam pelo chat; ficam guardados de forma encriptada e só o servidor os lê.

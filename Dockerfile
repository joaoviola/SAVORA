# Worker Hub do SAVORA — na RAIZ de propósito.
#
# O serviço no Render ficou preso em modo Docker, à procura de um
# Dockerfile aqui. Em vez de exigir a correcção de campos no painel,
# este ficheiro satisfaz essa procura e constrói o que é preciso: o
# serviço Python de scraper/, não o front-end.
#
# O front-end tem o seu em deploy/app.Dockerfile e vai para a Vercel.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# O contexto é a raiz do repositório, por isso os caminhos levam scraper/
COPY scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scraper/api.py scraper/baixar_ig.py ./

# Script real, copiado — não gerado com printf dentro do Dockerfile.
# A versão anterior escapava \n à mão e um deles virou quebra de linha
# a sério, partindo o RUN em duas instruções.
COPY scraper/start.sh /app/start.sh
RUN chmod +x /app/start.sh

RUN useradd --create-home app && chown -R app:app /app
USER app

EXPOSE 8000
CMD ["/app/start.sh"]

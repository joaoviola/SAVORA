# Worker Hub do SAVORA — na RAIZ de proposito.
#
# O servico no Render ficou preso em modo Docker, a procurar um
# Dockerfile aqui. Em vez de exigir que alguem corrija quatro campos no
# painel, este ficheiro satisfaz essa procura e constroi o que e
# preciso: o servico Python de scraper/, nao o front-end.
#
# O front-end tem o seu em deploy/app.Dockerfile e vai para a Vercel.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Contexto e a raiz do repositorio, por isso os caminhos levam scraper/
COPY scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scraper/api.py scraper/baixar_ig.py ./

RUN useradd --create-home app && chown -R app:app /app
USER app

EXPOSE 8000
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]

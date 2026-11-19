# Worker Hub do SAVORA — serviço de extração em Python.
#
# Constrói só esta pasta, não o app TanStack da raiz do repositório.
#   fly deploy      (a partir de scraper/)
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# curl_cffi traz wheels para linux; sem compilador, imagem pequena.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api.py baixar_ig.py ./
COPY web ./web

# Utilizador sem privilégios: se o serviço for comprometido, não é root.
RUN useradd --create-home --shell /usr/sbin/nologin app && chown -R app:app /app
USER app

EXPOSE 8000
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]

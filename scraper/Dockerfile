# Worker Hub do SAVORA — serviço de extração em Python.
#
# Constrói só esta pasta, não o app TanStack da raiz do repositório.
#   Render: New -> Blueprint (le o render.yaml na raiz do repositorio)
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# curl_cffi traz wheels para linux; sem compilador, imagem pequena.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Apenas os dois modulos que o servico usa. Nao copiar 'web': essa pasta
# foi removida junto com o front-end de demonstracao, e um COPY de algo
# inexistente faz o build falhar.
COPY api.py baixar_ig.py ./

# Utilizador sem privilégios: se o serviço for comprometido, não é root.
RUN useradd --create-home --shell /usr/sbin/nologin app && chown -R app:app /app
USER app

EXPOSE 8000
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]

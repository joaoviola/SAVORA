#!/bin/sh
# Arranque do Worker Hub.
#
# Ficheiro real em vez de um 'printf' dentro do Dockerfile: a versao
# anterior gerava este conteudo com \n escapados e um deles virou quebra
# de linha a serio, partindo o RUN e produzindo
# 'dockerfile parse error: unknown instruction: exec'.
#
# 'python -m uvicorn' em vez do binario 'uvicorn' por nao depender do PATH.
exec python -m uvicorn api:app --host 0.0.0.0 --port "${PORT:-8000}"

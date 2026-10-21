#!/usr/bin/env bash
# Sobe a API em Docker, garantindo antes que o Ollama do host está acessível
# pelo container (ver ollama.sh). Não sobe o frontend — rode à parte com
# `cd frontend && npm run dev`.
set -e
cd "$(dirname "$0")"

./ollama.sh

docker compose up --build -d

echo
echo "API em http://localhost:8000 — confira com: curl http://localhost:8000/api/saude"

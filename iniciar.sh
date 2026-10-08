#!/usr/bin/env bash
# Sobe o backend (FastAPI, porta 8000) e o site (Vite, porta 5173).
set -e
cd "$(dirname "$0")"

if [ ! -d backend/.venv ]; then
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -q -r backend/requirements.txt
fi
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -d frontend/node_modules ] || (cd frontend && npm install)

(cd backend && .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000) &
BACK=$!
trap 'kill $BACK 2>/dev/null' EXIT

cd frontend && npm run dev

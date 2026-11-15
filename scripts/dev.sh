#!/usr/bin/env bash
#
# Run ScholarFind locally: PostgreSQL-backed Django API + Vite client.
#
#   ./scripts/dev.sh            # start API on :8000 and client on :3000
#   BACKEND_PORT=8010 FRONTEND_PORT=3010 ./scripts/dev.sh
#   SEED=0 ./scripts/dev.sh     # skip the bundled-catalogue import
#
# Connection settings are read from backend/.env when it exists (gitignored),
# otherwise from POSTGRES_* / DATABASE_URL in the environment.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
SEED="${SEED:-1}"

if [[ -f backend/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source backend/.env
  set +a
fi

export DJANGO_ENV="${DJANGO_ENV:-development}"
export DJANGO_DEBUG="${DJANGO_DEBUG:-True}"
export POSTGRES_DB="${POSTGRES_DB:-scholarfind_django}"
export POSTGRES_USER="${POSTGRES_USER:-scholarfind}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
export POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export VITE_API_PROXY_TARGET="${VITE_API_PROXY_TARGET:-http://127.0.0.1:${BACKEND_PORT}}"

fail() {
  echo "error: $1" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail "Node.js is not installed."
command -v python >/dev/null 2>&1 || fail "Python is not installed."
python -c "import django" >/dev/null 2>&1 || \
  fail "Django is not installed. Run: python -m pip install -r backend/requirements.txt"
[[ -d node_modules ]] || fail "Client dependencies are missing. Run: npm install"

# Fail early with an actionable message instead of a Django traceback.
if ! (cd backend && python - <<'PY' >/dev/null 2>&1
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.db import connection
connection.ensure_connection()
PY
); then
  fail "cannot reach PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT} (db ${POSTGRES_DB}).
       Start PostgreSQL, then set DATABASE_URL or POSTGRES_* in backend/.env
       (copy backend/.env.example if that file does not exist yet)."
fi

echo "==> Applying migrations"
(cd backend && python manage.py migrate --noinput)

if [[ "$SEED" == "1" ]]; then
  echo "==> Importing the bundled catalogue (idempotent)"
  (cd backend && python manage.py seed_catalogue_bundle)
fi

api_pid=""
web_pid=""
cleanup() {
  trap - EXIT INT TERM
  [[ -n "$api_pid" ]] && kill "$api_pid" 2>/dev/null || true
  [[ -n "$web_pid" ]] && kill "$web_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> Django API  http://127.0.0.1:${BACKEND_PORT}/api/v1/"
(cd backend && exec python manage.py runserver "0.0.0.0:${BACKEND_PORT}") &
api_pid=$!

echo "==> Web client  http://localhost:${FRONTEND_PORT}/"
npx vite --host 0.0.0.0 --port "$FRONTEND_PORT" &
web_pid=$!

wait -n "$api_pid" "$web_pid"

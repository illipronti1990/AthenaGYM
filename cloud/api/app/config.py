"""Configuração da API — SQLite local ou PostgreSQL via DATABASE_URL."""

from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Padrão: SQLite (zero instalação). Produção: PostgreSQL.
# Ex.: postgresql+psycopg://athena:athena@localhost:5432/athena
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{(DATA_DIR / 'athena.db').as_posix()}",
)

API_TITLE = "ATHENA GYM API"
API_VERSION = "0.19.0"
SECRET_KEY = os.getenv("ATHENA_SECRET", "athena-gym-dev-secret-change-me")
TOKEN_HOURS = int(os.getenv("ATHENA_TOKEN_HOURS", "168"))
CORS_ORIGINS = os.getenv("ATHENA_CORS", "*").split(",")

# Pacote oficial supabase-py (PostgREST / Auth / Storage)
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("PUBLIC_SUPABASE_URL", "")
SUPABASE_PUBLISHABLE_KEY = (
    os.getenv("SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY", "")
)
# Preferir service role no backend (nunca no front)
SUPABASE_SECRET_KEY = (
    os.getenv("SUPABASE_SECRET_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or ""
)
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "")

PROJECT_ROOT = ROOT.parent.parent  # ATHENA GYM/
SYNC_JSON_CANDIDATES = [
    DATA_DIR / "portal_export.json",
    PROJECT_ROOT / "Sync" / "portal_export.json",
]

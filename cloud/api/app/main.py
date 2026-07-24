"""
ATHENAS GYM Cloud API — Sprint 12.0 (SQL Foundation)

Excel VBA (ops) ──sync JSON──► FastAPI ──SQL──► Portal Web / Flutter
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_TITLE, API_VERSION, CORS_ORIGINS, DATABASE_URL, SUPABASE_URL
from app.routers import alunos, auth, supabase_routes, sync
from app.supabase_client import supabase_status


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Auth/alunos/sync usam supabase-py. SQLAlchemy só sobe se DATABASE_URL for local/SQLite.
    sb = supabase_status()
    print(f"[startup] supabase configured={sb['configured']} reachable={sb['reachable']}")
    if DATABASE_URL.startswith("sqlite"):
        try:
            from app.db import SessionLocal, init_db
            from app.services.seed import seed_if_empty

            init_db()
            db = SessionLocal()
            try:
                seed_if_empty(db)
            finally:
                db.close()
        except Exception as exc:  # noqa: BLE001
            print(f"[startup] SQLAlchemy/seed avisou: {exc}")
    else:
        print("[startup] pulando SQLAlchemy (auth/dados via supabase-py)")
    yield


app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="Contrato cloud: Excel sync + Portal + App · Supabase (supabase-py)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(alunos.router)
app.include_router(sync.router)
app.include_router(supabase_routes.router)


@app.get("/health")
def health() -> dict:
    sb = supabase_status()
    return {
        "status": "ok",
        "service": "athenas-gym-api",
        "version": API_VERSION,
        "store": "supabase-py",
        "database_url_engine": DATABASE_URL.split("://", 1)[0],
        "supabase": {
            "url": SUPABASE_URL or None,
            "configured": sb["configured"],
            "reachable": sb["reachable"],
        },
    }


@app.get("/")
def root() -> dict:
    return {
        "name": API_TITLE,
        "version": API_VERSION,
        "docs": "/docs",
        "architecture": {
            "ops": "Excel VBA",
            "contract": "FastAPI",
            "store": "Supabase (supabase-py)",
            "clients": ["portal-web", "flutter"],
        },
        "login": "POST /auth/login",
        "sync": "POST /sync/import | POST /sync/push",
        "supabase_status": "GET /supabase/status",
    }

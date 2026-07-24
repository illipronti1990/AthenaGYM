"""Rotas de status / smoke test do pacote Supabase."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth_context import AuthUser
from app.routers.auth import get_current_user
from app.supabase_client import require_supabase, supabase_status

router = APIRouter(prefix="/supabase", tags=["supabase"])


@router.get("/status")
def status() -> dict:
    """Verifica se o client supabase-py está configurado e alcança o projeto."""
    return supabase_status()


@router.get("/empresas")
def listar_empresas(user: AuthUser = Depends(get_current_user)) -> dict:
    """
    Lê empresas via PostgREST (pacote supabase).
    Requer tabela `empresas` criada no projeto (SQLAlchemy init_db ou SQL Editor).
    """
    if user.perfil not in ("SuperAdmin", "Administrador"):
        raise HTTPException(403, "Somente SuperAdmin/Administrador")
    client = require_supabase()
    try:
        res = client.table("empresas").select("id,nome_fantasia,plano,status").order("id").execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            503,
            f"Falha ao consultar Supabase: {exc}. "
            "Crie as tabelas (subir API com DATABASE_URL do Postgres ou rode o SQL no Editor).",
        ) from exc
    return {"origem": "supabase-py", "count": len(res.data or []), "empresas": res.data or []}

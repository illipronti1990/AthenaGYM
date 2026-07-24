"""Cliente oficial supabase-py (PostgREST, Auth, Storage)."""

from __future__ import annotations

from functools import lru_cache

from fastapi import HTTPException

from app.config import SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_URL


class SupabaseNotConfigured(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_supabase():
    """
    Client com chave secreta (service role / secret).
    Usar apenas no backend — nunca no portal/Flutter.
    """
    if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
        raise SupabaseNotConfigured(
            "Defina SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) no .env"
        )
    try:
        from supabase import create_client
    except ImportError as exc:
        raise SupabaseNotConfigured(
            "Pacote supabase não instalado. Rode: python -m pip install supabase"
        ) from exc
    return create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


@lru_cache(maxsize=1)
def get_supabase_anon():
    """Client com chave publishable/anon — operações públicas limitadas."""
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise SupabaseNotConfigured(
            "Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no .env"
        )
    from supabase import create_client

    return create_client(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)


def require_supabase():
    try:
        return get_supabase()
    except SupabaseNotConfigured as exc:
        raise HTTPException(503, str(exc)) from exc


def supabase_status() -> dict:
    configured = bool(SUPABASE_URL and SUPABASE_SECRET_KEY)
    out: dict = {
        "configured": configured,
        "url": SUPABASE_URL or None,
        "has_secret": bool(SUPABASE_SECRET_KEY),
        "has_publishable": bool(SUPABASE_PUBLISHABLE_KEY),
        "reachable": False,
        "error": None,
    }
    if not configured:
        out["error"] = "SUPABASE_URL / SUPABASE_SECRET_KEY ausentes"
        return out
    try:
        client = get_supabase()
        # Ping leve: lista schemas via uma query genérica; tabela pode não existir ainda
        client.table("empresas").select("id").limit(1).execute()
        out["reachable"] = True
        out["table_check"] = "empresas"
    except Exception as exc:  # noqa: BLE001
        # Ainda “conectado” ao projeto se o erro for só tabela inexistente
        msg = str(exc)
        out["error"] = msg[:300]
        if "Could not find the table" in msg or "PGRST" in msg or "42P01" in msg:
            out["reachable"] = True
            out["table_check"] = "missing (rode migrations/seed)"
        else:
            out["reachable"] = False
    return out

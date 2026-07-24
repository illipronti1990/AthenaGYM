"""Sync Excel JSON → Supabase."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException

from app.auth_context import AuthUser
from app.config import DATA_DIR
from app.routers.auth import get_current_user
from app.schemas import SyncPushIn, SyncResult
from app.services import sb_sync
from app.services.seed import find_export_json
from app.supabase_client import require_supabase

router = APIRouter(prefix="/sync", tags=["sync"])


def _empresa_efetiva(user: AuthUser, override: int | None = None) -> int:
    if user.perfil == "SuperAdmin" and override is not None:
        return int(override)
    if user.empresa_id and user.empresa_id > 0:
        return int(user.empresa_id)
    return int(override or 1)


@router.post("/import", response_model=SyncResult)
def sync_import(user: AuthUser = Depends(get_current_user)) -> SyncResult:
    """Lê portal_export.json (pasta Sync/ ou cloud/api/data/) e upserta no Supabase."""
    if user.perfil not in ("Administrador", "Recepção", "SuperAdmin"):
        raise HTTPException(403, "Somente admin/recepção")
    require_supabase()
    src = find_export_json()
    if src is None:
        raise HTTPException(
            404,
            "portal_export.json não encontrado. No Excel: botão Sync Cloud, ou POST /sync/push com JSON.",
        )

    dest = DATA_DIR / "portal_export.json"
    if src.resolve() != dest.resolve():
        dest.write_bytes(src.read_bytes())

    try:
        result = sb_sync.import_from_file(dest, _empresa_efetiva(user))
    except Exception as exc:  # noqa: BLE001
        sb_sync.registrar_sync_log(
            origem="excel-file",
            arquivo=str(dest),
            alunos_upsert=0,
            status="ERRO",
            detalhe=str(exc),
        )
        raise HTTPException(500, f"Falha no import Supabase: {exc}") from exc

    return SyncResult(
        status="ok",
        alunos_upsert=int(result["alunos_upsert"]),
        arquivo=str(result["arquivo"]),
        engine="supabase",
    )


@router.post("/push", response_model=SyncResult)
def sync_push(body: SyncPushIn, user: AuthUser = Depends(get_current_user)) -> SyncResult:
    """Recebe alunos direto do Excel (HTTP) e grava no Supabase."""
    if user.perfil not in ("Administrador", "Recepção", "SuperAdmin"):
        raise HTTPException(403, "Somente admin/recepção")
    require_supabase()
    if not body.alunos:
        raise HTTPException(400, "Lista de alunos vazia")

    empresa_id = _empresa_efetiva(user, body.empresa_id)
    # Espelha payload em data/ para auditoria local
    dest = DATA_DIR / "portal_export.json"
    try:
        dest.write_text(
            json.dumps(
                {
                    "versao": body.versao or "excel-push",
                    "empresa_id": empresa_id,
                    "alunos": body.alunos,
                    "origem": "sync/push",
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        result = sb_sync.import_from_payload(body.alunos, empresa_id, origem="excel-push")
    except Exception as exc:  # noqa: BLE001
        sb_sync.registrar_sync_log(
            origem="excel-push",
            arquivo=str(dest),
            alunos_upsert=0,
            status="ERRO",
            detalhe=str(exc),
        )
        raise HTTPException(500, f"Falha no push Supabase: {exc}") from exc

    return SyncResult(
        status="ok",
        alunos_upsert=int(result["alunos_upsert"]),
        arquivo=str(dest),
        engine="supabase",
    )


@router.get("/status")
def sync_status(user: AuthUser = Depends(get_current_user)) -> dict:
    found = find_export_json()
    last = sb_sync.ultimo_sync()
    return {
        "database": "supabase",
        "export_encontrado": str(found) if found else None,
        "empresa_id_sessao": user.empresa_id,
        "ultimo_sync": last,
        "endpoints": {"import_arquivo": "POST /sync/import", "push_json": "POST /sync/push"},
    }

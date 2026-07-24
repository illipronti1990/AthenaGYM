"""Import Excel JSON → Supabase (alunos + sync_log)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.supabase_client import get_supabase


def upsert_alunos(alunos: list[dict[str, Any]], empresa_id: int) -> int:
    client = get_supabase()
    upsert = 0
    for a in alunos:
        mat = str(a.get("matricula") or "").strip()
        if not mat:
            continue
        payload = {
            "empresa_id": int(a.get("empresa_id") or empresa_id),
            "unidade_id": int(a.get("unidade_id") or a.get("UnidadeID") or 1),
            "matricula": mat,
            "nome": str(a.get("nome") or mat),
            "plano": a.get("plano") or None,
            "professor": a.get("professor") or None,
            "status": a.get("status") or "Ativo",
        }
        if a.get("telefone"):
            payload["telefone"] = str(a["telefone"])
        if a.get("email"):
            payload["email"] = str(a["email"])
        if a.get("unidade"):
            payload["unidade"] = str(a["unidade"])

        eid = payload["empresa_id"]
        existing = (
            client.table("alunos")
            .select("id")
            .eq("empresa_id", eid)
            .eq("matricula", mat)
            .limit(1)
            .execute()
        )
        if existing.data:
            client.table("alunos").update(payload).eq("id", existing.data[0]["id"]).execute()
        else:
            client.table("alunos").insert(payload).execute()
        upsert += 1
    return upsert


def registrar_sync_log(
    *,
    origem: str,
    arquivo: str | None,
    alunos_upsert: int,
    status: str = "OK",
    detalhe: str | None = None,
) -> None:
    try:
        get_supabase().table("sync_log").insert(
            {
                "origem": origem,
                "arquivo": arquivo,
                "alunos_upsert": alunos_upsert,
                "status": status,
                "detalhe": detalhe,
            }
        ).execute()
    except Exception:  # noqa: BLE001
        # sync_log é opcional — não quebra o import
        pass


def ultimo_sync() -> dict | None:
    try:
        res = (
            get_supabase()
            .table("sync_log")
            .select("id,origem,arquivo,alunos_upsert,status,detalhe,criado_em")
            .order("id", desc=True)
            .limit(1)
            .execute()
        )
        if res.data:
            return res.data[0]
    except Exception:  # noqa: BLE001
        return None
    return None


def import_from_file(path: Path, empresa_id: int) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    alunos = data.get("alunos") or []
    empresa = int(data.get("empresa_id") or empresa_id)
    n = upsert_alunos(alunos, empresa)
    registrar_sync_log(
        origem="excel-file",
        arquivo=str(path),
        alunos_upsert=n,
        detalhe=f"versao={data.get('versao')}",
    )
    return {"alunos_upsert": n, "arquivo": str(path), "empresa_id": empresa}


def import_from_payload(alunos: list[dict[str, Any]], empresa_id: int, origem: str = "excel-push") -> dict[str, Any]:
    n = upsert_alunos(alunos, empresa_id)
    registrar_sync_log(
        origem=origem,
        arquivo=None,
        alunos_upsert=n,
        detalhe=f"empresa_id={empresa_id}",
    )
    return {"alunos_upsert": n, "empresa_id": empresa_id}

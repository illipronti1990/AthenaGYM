"""Auth + tokens assinados (sem tabela de sessão) sobre Supabase."""

from __future__ import annotations

import hashlib
import hmac
import time
from datetime import datetime, timedelta

from app.auth_context import AuthUser
from app.config import SECRET_KEY, TOKEN_HOURS
from app.supabase_client import get_supabase


def hash_senha(senha: str) -> str:
    salt = SECRET_KEY.encode("utf-8")
    digest = hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"), salt, 120_000)
    return digest.hex()


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return hmac.compare_digest(hash_senha(senha), senha_hash)


def criar_token(user: AuthUser) -> str:
    exp = int((datetime.utcnow() + timedelta(hours=TOKEN_HOURS)).timestamp())
    payload = f"{user.id}:{user.usuario}:{exp}"
    sig = hmac.new(SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()[:32]
    return f"atk-{user.id}-{exp}-{sig}"


def _parse_token(token: str) -> tuple[int, str, int, str] | None:
    # atk-{id}-{exp}-{sig}
    if not token.startswith("atk-"):
        return None
    parts = token.split("-")
    if len(parts) < 4:
        return None
    try:
        uid = int(parts[1])
        exp = int(parts[2])
        sig = parts[3]
        # usuario não está no token novo — só id/exp/sig
        return uid, "", exp, sig
    except ValueError:
        return None


def usuario_por_token(token: str) -> AuthUser | None:
    parsed = _parse_token(token)
    if not parsed:
        return None
    uid, _, exp, sig = parsed
    if exp < int(time.time()):
        return None
    row = _fetch_usuario_by_id(uid)
    if not row:
        return None
    expected_payload = f"{row.id}:{row.usuario}:{exp}"
    expected = hmac.new(
        SECRET_KEY.encode("utf-8"), expected_payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()[:32]
    if not hmac.compare_digest(expected, sig):
        return None
    if row.status != "Ativo":
        return None
    return row


def _row_to_user(data: dict) -> AuthUser:
    empresa_id = int(data.get("empresa_id") or 1)
    franqueadora_id = 0
    franqueado_id = 0
    try:
        emp = buscar_empresa(empresa_id)
        if emp:
            franqueadora_id = int(emp.get("franqueadora_id") or 0)
            franqueado_id = int(emp.get("franqueado_id") or 0)
    except Exception:  # noqa: BLE001
        pass
    if str(data.get("perfil") or "") == "Franqueadora":
        franqueadora_id = franqueadora_id or 1
        franqueado_id = 0
    return AuthUser(
        id=int(data["id"]),
        empresa_id=empresa_id,
        nome=str(data.get("nome") or ""),
        usuario=str(data.get("usuario") or ""),
        perfil=str(data.get("perfil") or ""),
        status=str(data.get("status") or "Ativo"),
        matricula=data.get("matricula") or None,
        unidade_id=int(data.get("unidade_id") or 0),
        franqueadora_id=franqueadora_id,
        franqueado_id=franqueado_id,
    )


def _fetch_usuario_by_id(uid: int) -> AuthUser | None:
    client = get_supabase()
    res = client.table("usuarios").select("*").eq("id", uid).limit(1).execute()
    if not res.data:
        return None
    return _row_to_user(res.data[0])


def buscar_usuario_login(usuario: str) -> AuthUser | None:
    client = get_supabase()
    # tenta lower e original
    for candidate in (usuario.lower(), usuario):
        res = client.table("usuarios").select("*").eq("usuario", candidate).limit(1).execute()
        if res.data:
            return _row_to_user(res.data[0])
    return None


def senha_hash_do_usuario(usuario: str) -> str | None:
    client = get_supabase()
    for candidate in (usuario.lower(), usuario):
        res = (
            client.table("usuarios")
            .select("senha_hash,usuario")
            .eq("usuario", candidate)
            .limit(1)
            .execute()
        )
        if res.data:
            return str(res.data[0].get("senha_hash") or "")
    return None


def buscar_empresa(empresa_id: int) -> dict | None:
    client = get_supabase()
    res = (
        client.table("empresas")
        .select("id,nome_fantasia,plano,status,franqueadora_id,franqueado_id")
        .eq("id", empresa_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    return res.data[0]

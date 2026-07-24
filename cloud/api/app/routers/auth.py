"""Rotas de autenticação — Supabase (supabase-py)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException

from app.auth_context import AuthUser
from app.schemas import LoginIn, LoginOut
from app.services import sb_auth

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Token ausente. Faça login em /auth/login")
    token = authorization.split(" ", 1)[1].strip()
    try:
        user = sb_auth.usuario_por_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(503, f"Supabase indisponível: {exc}") from exc
    if not user:
        raise HTTPException(401, "Token inválido ou expirado")
    if user.status != "Ativo":
        raise HTTPException(403, "Usuário inativo")
    return user


@router.post("/login", response_model=LoginOut)
def login(body: LoginIn) -> LoginOut:
    try:
        user = sb_auth.buscar_usuario_login(body.usuario)
        senha_hash = sb_auth.senha_hash_do_usuario(body.usuario) if user else None
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(503, f"Supabase indisponível: {exc}") from exc

    if not user or not senha_hash or not sb_auth.verificar_senha(body.senha, senha_hash):
        raise HTTPException(401, "Usuário ou senha inválidos")

    emp = sb_auth.buscar_empresa(user.empresa_id)
    token = sb_auth.criar_token(user)
    nome_uni = ""
    try:
        client = __import__("app.supabase_client", fromlist=["get_supabase"]).get_supabase()
        if user.unidade_id and user.unidade_id > 0:
            ur = client.table("unidades").select("nome").eq("id", user.unidade_id).limit(1).execute()
            if ur.data:
                nome_uni = str(ur.data[0].get("nome") or "")
    except Exception:  # noqa: BLE001
        nome_uni = ""
    return LoginOut(
        token=token,
        perfil=user.perfil,
        nome=user.nome,
        matricula=user.matricula or "",
        empresa_id=user.empresa_id,
        unidade_id=user.unidade_id,
        plano=(emp or {}).get("plano") or "Enterprise",
        nome_empresa=(emp or {}).get("nome_fantasia") or "",
        nome_unidade=nome_uni or ("Todas" if user.unidade_id <= 0 else ""),
        franqueadora_id=user.franqueadora_id or int((emp or {}).get("franqueadora_id") or 0),
        franqueado_id=user.franqueado_id or int((emp or {}).get("franqueado_id") or 0),
    )


@router.get("/me")
def me(user: AuthUser = Depends(get_current_user)) -> dict:
    emp = sb_auth.buscar_empresa(user.empresa_id)
    return {
        "usuario": user.usuario,
        "perfil": user.perfil,
        "nome": user.nome,
        "matricula": user.matricula or "",
        "empresa_id": user.empresa_id,
        "unidade_id": user.unidade_id,
        "franqueadora_id": user.franqueadora_id or int((emp or {}).get("franqueadora_id") or 0),
        "franqueado_id": user.franqueado_id or int((emp or {}).get("franqueado_id") or 0),
        "plano": (emp or {}).get("plano") or "",
        "nome_empresa": (emp or {}).get("nome_fantasia") or "",
        "origem": "supabase",
    }

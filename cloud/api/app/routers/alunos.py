"""Rotas de alunos / portal — Supabase (supabase-py)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth_context import AuthUser
from app.routers.auth import get_current_user
from app.schemas import MensagemIn, PagamentoIn
from app.services import sb_alunos, sb_auth

router = APIRouter(tags=["alunos"])


def _guard_aluno(user: AuthUser, matricula: str) -> None:
    if user.perfil == "Aluno" and (user.matricula or "") != matricula:
        raise HTTPException(403, "Acesso negado a outro aluno")


@router.get("/me")
def me_alias(user: AuthUser = Depends(get_current_user)) -> dict:
    emp = sb_auth.buscar_empresa(user.empresa_id)
    return {
        "usuario": user.usuario,
        "perfil": user.perfil,
        "nome": user.nome,
        "matricula": user.matricula or "",
        "empresa_id": user.empresa_id,
        "plano": (emp or {}).get("plano") or "",
        "nome_empresa": (emp or {}).get("nome_fantasia") or "",
        "origem": "supabase",
    }


@router.get("/alunos")
def listar_alunos(user: AuthUser = Depends(get_current_user)) -> list[dict]:
    if user.perfil == "Aluno":
        raise HTTPException(403, "Perfil aluno não lista todos")
    return sb_alunos.listar_alunos(user)


@router.get("/alunos/{matricula}")
def aluno_detalhe(matricula: str, user: AuthUser = Depends(get_current_user)) -> dict:
    _guard_aluno(user, matricula)
    data = sb_alunos.detalhe_aluno(matricula, user)
    if not data:
        raise HTTPException(404, "Aluno não encontrado")
    return data


@router.get("/alunos/{matricula}/treino")
def aluno_treino(matricula: str, user: AuthUser = Depends(get_current_user)) -> dict:
    _guard_aluno(user, matricula)
    return sb_alunos.treino_aluno(matricula)


@router.get("/alunos/{matricula}/acessos")
def aluno_acessos(matricula: str, user: AuthUser = Depends(get_current_user)) -> list[dict]:
    _guard_aluno(user, matricula)
    return sb_alunos.acessos_aluno(matricula)


@router.get("/notificacoes")
def notificacoes(user: AuthUser = Depends(get_current_user)) -> list[dict]:
    return sb_alunos.notificacoes(user)


@router.post("/chat")
def chat(body: MensagemIn, user: AuthUser = Depends(get_current_user)) -> dict:
    return sb_alunos.enviar_chat(user, body.para, body.matricula, body.mensagem)


@router.post("/pagamentos/pix")
def gerar_pix(body: PagamentoIn, user: AuthUser = Depends(get_current_user)) -> dict:
    if user.perfil == "Aluno":
        _guard_aluno(user, body.matricula)
    return {
        "matricula": body.matricula,
        "forma": body.forma,
        "qr_code": "ATHENAS-PIX-DEMO-QR",
        "copia_cola": "00020126ATHENASGYMPIXDEMO",
        "status": "Aguardando pagamento",
        "origem": "supabase",
    }


@router.get("/gestor/resumo")
def gestor_resumo(user: AuthUser = Depends(get_current_user)) -> dict:
    if user.perfil not in ("Administrador", "Recepção", "Financeiro", "SuperAdmin"):
        raise HTTPException(403, "Somente gestão")
    return sb_alunos.gestor_resumo(user)

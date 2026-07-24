"""Schemas Pydantic (contrato da API)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    usuario: str
    senha: str


class LoginOut(BaseModel):
    token: str
    perfil: str
    nome: str
    matricula: str = ""
    empresa_id: int = 1
    unidade_id: int = 0
    plano: str = "Enterprise"
    nome_empresa: str = ""
    nome_unidade: str = ""
    franqueadora_id: int = 0
    franqueado_id: int = 0


class MensagemIn(BaseModel):
    para: str = "aluno"
    matricula: str
    mensagem: str = Field(min_length=1)


class PagamentoIn(BaseModel):
    matricula: str
    competencia: str = ""
    forma: str = "PIX"


class AlunoOut(BaseModel):
    matricula: str
    nome: str
    plano: str | None = None
    professor: str | None = None
    status: str = "Ativo"

    class Config:
        from_attributes = True


class SyncResult(BaseModel):
    status: str
    alunos_upsert: int = 0
    arquivo: str | None = None
    engine: str


class SyncPushIn(BaseModel):
    alunos: list[dict] = Field(default_factory=list)
    empresa_id: int | None = None
    versao: str | None = None

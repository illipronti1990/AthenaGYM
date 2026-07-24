"""Contexto de autenticação (independente do SQLAlchemy)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class AuthUser:
    id: int
    empresa_id: int
    nome: str
    usuario: str
    perfil: str
    status: str
    matricula: str | None = None
    unidade_id: int = 0
    franqueadora_id: int = 0
    franqueado_id: int = 0

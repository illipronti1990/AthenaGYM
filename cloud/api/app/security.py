"""Hash de senha e tokens de sessão."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import SECRET_KEY, TOKEN_HOURS
from app.models import SessaoToken, Usuario


def hash_senha(senha: str) -> str:
    """PBKDF2-SHA256 — sem dependência externa pesada."""
    salt = SECRET_KEY.encode("utf-8")
    digest = hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"), salt, 120_000)
    return digest.hex()


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return hmac.compare_digest(hash_senha(senha), senha_hash)


def criar_token(db: Session, usuario: Usuario) -> str:
    token = f"atk-{usuario.usuario}-{secrets.token_hex(16)}"
    expira = datetime.utcnow() + timedelta(hours=TOKEN_HOURS)
    db.add(SessaoToken(token=token, usuario_id=usuario.id, expira_em=expira))
    db.commit()
    return token


def usuario_por_token(db: Session, token: str) -> Usuario | None:
    row = db.query(SessaoToken).filter(SessaoToken.token == token).first()
    if not row:
        return None
    if row.expira_em < datetime.utcnow():
        db.delete(row)
        db.commit()
        return None
    return row.usuario

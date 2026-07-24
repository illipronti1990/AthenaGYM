"""Seed inicial multi-tenant + import do JSON do Excel."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.config import SYNC_JSON_CANDIDATES
from app.models import (
    Acesso,
    Aluno,
    Avaliacao,
    ChatMensagem,
    ConfigEmpresa,
    ContaReceber,
    Empresa,
    Licenca,
    MetaAluno,
    Notificacao,
    SyncLog,
    Treino,
    TreinoItem,
    Unidade,
    Usuario,
)
from app.security import hash_senha


def _ensure_user(
    db: Session,
    usuario: str,
    nome: str,
    senha: str,
    perfil: str,
    empresa_id: int = 1,
    matricula: str | None = None,
) -> None:
    row = (
        db.query(Usuario)
        .filter(Usuario.usuario == usuario, Usuario.empresa_id == empresa_id)
        .first()
    )
    if row:
        row.nome = nome
        row.perfil = perfil
        row.matricula = matricula
        row.senha_hash = hash_senha(senha)
        row.status = "Ativo"
        row.empresa_id = empresa_id
        return
    db.add(
        Usuario(
            empresa_id=empresa_id,
            nome=nome,
            usuario=usuario,
            senha_hash=hash_senha(senha),
            perfil=perfil,
            matricula=matricula,
            status="Ativo",
        )
    )


def seed_if_empty(db: Session) -> None:
    if db.query(Empresa).count() == 0:
        db.add(
            Empresa(
                id=0,
                razao_social="ATHENAS PLATFORM LTDA",
                nome_fantasia="ATHENAS PLATFORM",
                cnpj="00.000.000/0001-00",
                plano="Enterprise",
                status="Ativo",
                cidade="São Paulo",
                estado="SP",
                email="platform@athenas.gym",
                data_expiracao=datetime.utcnow() + timedelta(days=3650),
            )
        )
        db.add(
            Empresa(
                id=1,
                razao_social="ATHENAS GYM ACADEMIA LTDA",
                nome_fantasia="ATHENAS GYM",
                cnpj="12.345.678/0001-90",
                plano="Enterprise",
                status="Ativo",
                cidade="São Paulo",
                estado="SP",
                email="contato@athenas.gym",
                data_expiracao=datetime.utcnow() + timedelta(days=365),
            )
        )
        db.flush()
        db.add(
            Licenca(
                empresa_id=1,
                chave="ATH-ENT-1-DEMO-2026",
                plano="Enterprise",
                ativacao=date.today() - timedelta(days=30),
                expiracao=date.today() + timedelta(days=335),
                status="Ativa",
            )
        )
        for chave, valor in (
            ("Moeda", "BRL"),
            ("TimeZone", "America/Sao_Paulo"),
            ("BloquearInadimplente", "SIM"),
            ("DiasTolerancia", "5"),
        ):
            db.add(ConfigEmpresa(empresa_id=1, chave=chave, valor=valor))
        db.flush()
        db.commit()

    if db.query(Usuario).count() == 0:
        _ensure_user(db, "super", "Super Admin Plataforma", "123456", "SuperAdmin", 0)
        _ensure_user(db, "admin", "Administrador", "123456", "Administrador", 1)
        _ensure_user(db, "financeiro", "Financeiro", "123456", "Financeiro", 1)
        _ensure_user(db, "recepcao", "Recepção", "123456", "Recepção", 1)
        _ensure_user(db, "professor", "Carlos Mendes", "123456", "Professor", 1)
        _ensure_user(db, "aluno", "Mariana Oliveira", "123456", "Aluno", 1, "ATH-2026-000001")
        db.commit()

    if db.query(Unidade).count() == 0:
        db.add(Unidade(empresa_id=1, nome="ATHENAS GYM Matriz", cidade="São Paulo", status="Ativa"))
        db.add(Unidade(empresa_id=1, nome="ATHENAS GYM Zona Sul", cidade="São Paulo", status="Planejada"))
        db.commit()

    if db.query(Aluno).count() == 0:
        db.add(
            Aluno(
                empresa_id=1,
                matricula="ATH-2026-000001",
                nome="Mariana Oliveira",
                plano="Premium",
                professor="Carlos Mendes",
                status="Ativo",
                data_cadastro=date.today() - timedelta(days=120),
            )
        )
        db.add(
            Aluno(
                empresa_id=1,
                matricula="ATH-2026-000002",
                nome="Pedro Henrique Alves",
                plano="Básico",
                professor="Carlos Mendes",
                status="Ativo",
                data_cadastro=date.today() - timedelta(days=90),
            )
        )
        db.commit()

    if db.query(Treino).count() == 0:
        t = Treino(
            matricula="ATH-2026-000001",
            nome_aluno="Mariana Oliveira",
            divisao="ABCD",
            status="Ativo",
            comentario="Aumente a carga do supino.",
        )
        db.add(t)
        db.flush()
        for dia, ex, series, reps, ordem in (
            ("A", "Supino", "4", "12", 1),
            ("A", "Crucifixo", "3", "15", 2),
            ("A", "Pulley", "3", "12", 3),
            ("B", "Agachamento", "4", "10", 1),
        ):
            db.add(
                TreinoItem(
                    treino_id=t.id,
                    dia=dia,
                    exercicio=ex,
                    series=series,
                    repeticoes=reps,
                    ordem=ordem,
                )
            )
        db.commit()

    if db.query(Avaliacao).count() == 0:
        db.add(
            Avaliacao(
                matricula="ATH-2026-000001",
                data=date.today() - timedelta(days=15),
                peso=88.0,
                imc=26.1,
                gordura=22.4,
                massa_magra=50.1,
            )
        )
        db.commit()

    if db.query(Acesso).count() == 0:
        for i in range(3):
            db.add(
                Acesso(
                    matricula="ATH-2026-000001",
                    data=date.today() - timedelta(days=i),
                    entrada="07:00",
                    saida="08:15",
                    status="Liberado",
                )
            )
        db.commit()

    if db.query(ContaReceber).count() == 0:
        db.add(
            ContaReceber(
                empresa_id=1,
                matricula="ATH-2026-000001",
                competencia="Agosto/2026",
                valor=199.0,
                vencimento=date(2026, 8, 10),
                situacao="Em aberto",
            )
        )
        db.commit()

    if db.query(MetaAluno).count() == 0:
        db.add(
            MetaAluno(
                matricula="ATH-2026-000001",
                objetivo="Hipertrofia",
                meta=30,
                atual=23,
                unidade="dias treino/mês",
            )
        )
        db.commit()

    if db.query(ChatMensagem).count() == 0:
        db.add(
            ChatMensagem(
                de_usuario="professor",
                para_usuario="aluno",
                matricula="ATH-2026-000001",
                mensagem="Aumente a carga do supino nesta semana.",
                lida=True,
            )
        )
        db.commit()

    if db.query(Notificacao).count() == 0:
        db.add(
            Notificacao(
                usuario="aluno",
                matricula="ATH-2026-000001",
                mensagem="Sua mensalidade vence amanhã.",
                tipo="Financeiro",
            )
        )
        db.commit()


def find_export_json() -> Path | None:
    for p in SYNC_JSON_CANDIDATES:
        if p.exists():
            return p
    return None


def import_excel_json(db: Session, path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    alunos = data.get("alunos") or []
    upsert = 0
    for a in alunos:
        mat = str(a.get("matricula") or "").strip()
        if not mat:
            continue
        row = db.query(Aluno).filter(Aluno.matricula == mat, Aluno.empresa_id == 1).first()
        if row is None:
            row = Aluno(empresa_id=1, matricula=mat, nome=str(a.get("nome") or mat))
            db.add(row)
        row.nome = str(a.get("nome") or row.nome)
        row.plano = a.get("plano") or row.plano
        row.professor = a.get("professor") or row.professor
        row.status = a.get("status") or row.status or "Ativo"
        row.empresa_id = 1
        upsert += 1
    db.add(
        SyncLog(
            origem="excel",
            arquivo=str(path),
            alunos_upsert=upsert,
            status="OK",
            detalhe=f"import {path.name}",
        )
    )
    db.commit()
    return {"alunos_upsert": upsert, "arquivo": str(path)}

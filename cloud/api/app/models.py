"""Modelos SQL — multi-tenant (EmpresaID) + domínio academia."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    razao_social: Mapped[str] = mapped_column(String(200), nullable=False)
    nome_fantasia: Mapped[str] = mapped_column(String(150), nullable=False)
    cnpj: Mapped[str] = mapped_column(String(18), default="")
    plano: Mapped[str] = mapped_column(String(20), default="Enterprise")
    status: Mapped[str] = mapped_column(String(20), default="Ativo")
    cidade: Mapped[str | None] = mapped_column(String(80))
    estado: Mapped[str | None] = mapped_column(String(2))
    email: Mapped[str | None] = mapped_column(String(120))
    data_cadastro: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    data_expiracao: Mapped[datetime | None] = mapped_column(DateTime)
    franqueadora_id: Mapped[int] = mapped_column(Integer, default=0, index=True)
    franqueado_id: Mapped[int] = mapped_column(Integer, default=0, index=True)


class Franqueadora(Base):
    __tablename__ = "franqueadoras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    cnpj: Mapped[str] = mapped_column(String(18), default="")
    razao_social: Mapped[str] = mapped_column(String(200), default="")
    ceo: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(120))
    telefone: Mapped[str | None] = mapped_column(String(20))
    site: Mapped[str | None] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(20), default="Ativa")


class Franqueado(Base):
    __tablename__ = "franqueados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    franqueadora_id: Mapped[int] = mapped_column(Integer, index=True)
    empresa_id: Mapped[int] = mapped_column(Integer, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    cpf_cnpj: Mapped[str] = mapped_column(String(18), default="")
    cidade: Mapped[str | None] = mapped_column(String(80))
    estado: Mapped[str | None] = mapped_column(String(2))
    contrato: Mapped[str | None] = mapped_column(String(40))
    data_inicio: Mapped[date | None] = mapped_column(Date)
    data_fim: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="Ativo")


class ContratoFranquia(Base):
    __tablename__ = "contratos_franquia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero: Mapped[str] = mapped_column(String(40), nullable=False)
    franqueado_id: Mapped[int] = mapped_column(Integer, index=True)
    franqueado: Mapped[str | None] = mapped_column(String(150))
    vigencia_inicio: Mapped[date | None] = mapped_column(Date)
    vigencia_fim: Mapped[date | None] = mapped_column(Date)
    taxa_inicial: Mapped[float] = mapped_column(Float, default=0)
    royalty_pct: Mapped[float] = mapped_column(Float, default=6)
    fundo_marketing_pct: Mapped[float] = mapped_column(Float, default=2)
    status: Mapped[str] = mapped_column(String(20), default="Ativo")


class Royalty(Base):
    __tablename__ = "royalties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    franqueado_id: Mapped[int] = mapped_column(Integer, index=True)
    franqueado: Mapped[str | None] = mapped_column(String(150))
    competencia: Mapped[date] = mapped_column(Date, index=True)
    receita_base: Mapped[float] = mapped_column(Float, default=0)
    percentual: Mapped[float] = mapped_column(Float, default=6)
    valor_royalty: Mapped[float] = mapped_column(Float, default=0)
    percentual_marketing: Mapped[float] = mapped_column(Float, default=2)
    valor_marketing: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(20), default="Em Aberto")


class Licenca(Base):
    __tablename__ = "licencas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("empresas.id"), index=True)
    chave: Mapped[str] = mapped_column(String(64), unique=True)
    plano: Mapped[str] = mapped_column(String(20), default="Pro")
    ativacao: Mapped[date] = mapped_column(Date, default=date.today)
    expiracao: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="Ativa")


class ConfigEmpresa(Base):
    __tablename__ = "config_empresa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    empresa_id: Mapped[int] = mapped_column(Integer, ForeignKey("empresas.id"), index=True)
    chave: Mapped[str] = mapped_column(String(80), nullable=False)
    valor: Mapped[str] = mapped_column(String(255), nullable=False)


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (UniqueConstraint("empresa_id", "usuario", name="uq_usuario_empresa"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    empresa_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    unidade_id: Mapped[int] = mapped_column(Integer, default=0, index=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    usuario: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Ativo")
    matricula: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SessaoToken(Base):
    __tablename__ = "sessoes_token"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    token: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    expira_em: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    usuario: Mapped[Usuario] = relationship("Usuario")


class Unidade(Base):
    __tablename__ = "unidades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    empresa_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    nome: Mapped[str] = mapped_column(String(120))
    codigo: Mapped[str] = mapped_column(String(20), default="MX")
    cnpj: Mapped[str] = mapped_column(String(18), default="")
    telefone: Mapped[str | None] = mapped_column(String(20))
    whatsapp: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(120))
    cep: Mapped[str | None] = mapped_column(String(10))
    endereco: Mapped[str | None] = mapped_column(String(250))
    cidade: Mapped[str] = mapped_column(String(80), default="São Paulo")
    estado: Mapped[str] = mapped_column(String(2), default="SP")
    responsavel: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), default="Ativa")
    data_cadastro: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ParametroUnidade(Base):
    __tablename__ = "parametros_unidade"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    unidade_id: Mapped[int] = mapped_column(Integer, index=True)
    chave: Mapped[str] = mapped_column(String(80), nullable=False)
    valor: Mapped[str] = mapped_column(String(255), nullable=False)


class Aluno(Base):
    __tablename__ = "alunos"
    __table_args__ = (UniqueConstraint("empresa_id", "matricula", name="uq_alunos_empresa_mat"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    empresa_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    unidade_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    matricula: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(160), nullable=False)
    plano: Mapped[str | None] = mapped_column(String(60))
    professor: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="Ativo")
    telefone: Mapped[str | None] = mapped_column(String(40))
    email: Mapped[str | None] = mapped_column(String(120))
    unidade: Mapped[str | None] = mapped_column(String(120), default="ATHENA GYM Matriz")
    data_cadastro: Mapped[date | None] = mapped_column(Date)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Treino(Base):
    __tablename__ = "treinos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    matricula: Mapped[str] = mapped_column(String(40), index=True)
    nome_aluno: Mapped[str | None] = mapped_column(String(160))
    divisao: Mapped[str | None] = mapped_column(String(20), default="ABCD")
    status: Mapped[str] = mapped_column(String(20), default="Ativo")
    comentario: Mapped[str | None] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    itens: Mapped[list[TreinoItem]] = relationship("TreinoItem", back_populates="treino", cascade="all, delete-orphan")


class TreinoItem(Base):
    __tablename__ = "treino_itens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    treino_id: Mapped[int] = mapped_column(ForeignKey("treinos.id"), nullable=False)
    dia: Mapped[str] = mapped_column(String(10), default="A")
    exercicio: Mapped[str] = mapped_column(String(120))
    series: Mapped[str] = mapped_column(String(20), default="3")
    repeticoes: Mapped[str] = mapped_column(String(20), default="12")
    ordem: Mapped[int] = mapped_column(Integer, default=1)

    treino: Mapped[Treino] = relationship("Treino", back_populates="itens")


class Avaliacao(Base):
    __tablename__ = "avaliacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    matricula: Mapped[str] = mapped_column(String(40), index=True)
    data: Mapped[date] = mapped_column(Date, default=date.today)
    peso: Mapped[float | None] = mapped_column(Float)
    imc: Mapped[float | None] = mapped_column(Float)
    gordura: Mapped[float | None] = mapped_column(Float)
    massa_magra: Mapped[float | None] = mapped_column(Float)


class Acesso(Base):
    __tablename__ = "acessos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    matricula: Mapped[str] = mapped_column(String(40), index=True)
    data: Mapped[date] = mapped_column(Date, default=date.today)
    entrada: Mapped[str | None] = mapped_column(String(10))
    saida: Mapped[str | None] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), default="Liberado")


class ContaReceber(Base):
    __tablename__ = "contas_receber"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    empresa_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    unidade_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    matricula: Mapped[str] = mapped_column(String(40), index=True)
    competencia: Mapped[str | None] = mapped_column(String(40))
    valor: Mapped[float] = mapped_column(Float, default=0)
    vencimento: Mapped[date | None] = mapped_column(Date)
    situacao: Mapped[str] = mapped_column(String(30), default="Pendente")


class ChatMensagem(Base):
    __tablename__ = "chat"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    de_usuario: Mapped[str] = mapped_column(String(80))
    para_usuario: Mapped[str] = mapped_column(String(80))
    matricula: Mapped[str] = mapped_column(String(40), index=True)
    mensagem: Mapped[str] = mapped_column(Text)
    lida: Mapped[bool] = mapped_column(Boolean, default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario: Mapped[str] = mapped_column(String(80), index=True)
    matricula: Mapped[str | None] = mapped_column(String(40))
    mensagem: Mapped[str] = mapped_column(Text)
    tipo: Mapped[str] = mapped_column(String(40), default="Geral")
    lida: Mapped[bool] = mapped_column(Boolean, default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MetaAluno(Base):
    __tablename__ = "metas_aluno"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    matricula: Mapped[str] = mapped_column(String(40), index=True)
    objetivo: Mapped[str] = mapped_column(String(80))
    meta: Mapped[float] = mapped_column(Float, default=0)
    atual: Mapped[float] = mapped_column(Float, default=0)
    unidade: Mapped[str | None] = mapped_column(String(40))


class SyncLog(Base):
    __tablename__ = "sync_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    origem: Mapped[str] = mapped_column(String(40), default="excel")
    arquivo: Mapped[str | None] = mapped_column(String(255))
    alunos_upsert: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="OK")
    detalhe: Mapped[str | None] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

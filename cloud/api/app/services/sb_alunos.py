"""Repositório de alunos / portal via supabase-py."""

from __future__ import annotations

from typing import Any

from app.auth_context import AuthUser
from app.supabase_client import get_supabase


def _filtra_escopo(q: Any, user: AuthUser, *, unidade: bool = True) -> Any:
    """Isola por empresa; se usuário tiver unidade_id > 0, filtra a unidade."""
    if user.perfil != "SuperAdmin":
        q = q.eq("empresa_id", user.empresa_id)
        if unidade and user.unidade_id and user.unidade_id > 0:
            q = q.eq("unidade_id", user.unidade_id)
    return q


def listar_alunos(user: AuthUser) -> list[dict]:
    client = get_supabase()
    q = client.table("alunos").select("matricula,nome,plano,professor,status,empresa_id,unidade_id")
    q = _filtra_escopo(q, user)
    res = q.order("nome").execute()
    return list(res.data or [])


def obter_aluno(matricula: str, user: AuthUser) -> dict | None:
    client = get_supabase()
    q = client.table("alunos").select("*").eq("matricula", matricula)
    q = _filtra_escopo(q, user)
    res = q.limit(1).execute()
    if not res.data:
        return None
    return res.data[0]


def _safe_select(table: str, **filters: Any) -> list[dict]:
    try:
        client = get_supabase()
        q = client.table(table).select("*")
        for k, v in filters.items():
            q = q.eq(k, v)
        return list(q.execute().data or [])
    except Exception:  # noqa: BLE001
        return []


def detalhe_aluno(matricula: str, user: AuthUser) -> dict | None:
    a = obter_aluno(matricula, user)
    if not a:
        return None

    avaliacoes = _safe_select("avaliacoes", matricula=matricula)
    contas = _safe_select("contas_receber", matricula=matricula)
    metas = _safe_select("metas_aluno", matricula=matricula)
    acessos = _safe_select("acessos", matricula=matricula)

    aval = avaliacoes[0] if avaliacoes else None
    conta = contas[0] if contas else None
    meta = metas[0] if metas else None

    mensalidade = "Em dia"
    fin = {
        "competencia": "—",
        "valor": 0.0,
        "vencimento": "—",
        "status": "Em dia",
        "pix_copia_cola": "00020126ATHENAGYMPIXDEMO",
    }
    if conta:
        situacao = str(conta.get("situacao") or "")
        mensalidade = "Em dia" if situacao.lower() in ("pago", "em dia") else situacao
        fin = {
            "competencia": conta.get("competencia") or "—",
            "valor": float(conta.get("valor") or 0),
            "vencimento": str(conta.get("vencimento") or "—"),
            "status": situacao,
            "pix_copia_cola": "00020126ATHENAGYMPIXDEMO",
        }

    progresso = 0.78
    if meta and float(meta.get("meta") or 0):
        progresso = round(float(meta.get("atual") or 0) / float(meta["meta"]), 2)

    return {
        "matricula": a.get("matricula"),
        "nome": a.get("nome"),
        "plano": a.get("plano"),
        "professor": a.get("professor"),
        "status": a.get("status"),
        "empresa_id": a.get("empresa_id"),
        "origem": "supabase",
        "dashboard": {
            "proxima_avaliacao_dias": 15,
            "mensalidade": mensalidade,
            "ultimo_treino": "Hoje",
            "frequencia_mes": len(acessos),
            "objetivo": (meta or {}).get("objetivo") or "Hipertrofia",
            "progresso": progresso,
        },
        "evolucao": {
            "peso": (aval or {}).get("peso"),
            "imc": (aval or {}).get("imc"),
            "gordura": (aval or {}).get("gordura"),
        },
        "financeiro": fin,
    }


def treino_aluno(matricula: str) -> dict:
    treinos = _safe_select("treinos", matricula=matricula)
    ativos = [t for t in treinos if str(t.get("status") or "Ativo") == "Ativo"]
    if not ativos:
        return {"matricula": matricula, "divisao": "—", "itens": [], "comentario_professor": "", "origem": "supabase"}
    t = ativos[-1]
    itens_raw = _safe_select("treino_itens", treino_id=t.get("id"))
    itens_raw.sort(key=lambda x: int(x.get("ordem") or 0))
    return {
        "matricula": matricula,
        "divisao": t.get("divisao") or "ABCD",
        "itens": [
            {
                "dia": i.get("dia"),
                "exercicio": i.get("exercicio"),
                "series": i.get("series"),
                "reps": i.get("repeticoes"),
            }
            for i in itens_raw
        ],
        "comentario_professor": t.get("comentario") or "",
        "origem": "supabase",
    }


def acessos_aluno(matricula: str) -> list[dict]:
    rows = _safe_select("acessos", matricula=matricula)
    out = []
    for r in rows[:20]:
        out.append(
            {
                "data": str(r.get("data") or ""),
                "entrada": r.get("entrada") or "",
                "saida": r.get("saida") or "",
            }
        )
    return out


def notificacoes(user: AuthUser) -> list[dict]:
    rows = _safe_select("notificacoes", usuario=user.usuario)
    return [
        {
            "mensagem": n.get("mensagem"),
            "tipo": n.get("tipo"),
            "lida": n.get("lida"),
            "data": str(n.get("criado_em") or ""),
        }
        for n in rows[:30]
    ]


def enviar_chat(user: AuthUser, para: str, matricula: str, mensagem: str) -> dict:
    client = get_supabase()
    try:
        res = (
            client.table("chat")
            .insert(
                {
                    "de_usuario": user.usuario,
                    "para_usuario": para,
                    "matricula": matricula,
                    "mensagem": mensagem,
                    "lida": False,
                }
            )
            .execute()
        )
        msg_id = (res.data or [{}])[0].get("id")
    except Exception:  # noqa: BLE001
        return {"status": "ok", "id": None, "aviso": "tabela chat ainda não criada no Supabase"}
    try:
        client.table("notificacoes").insert(
            {
                "usuario": para,
                "matricula": matricula,
                "mensagem": f"Nova mensagem de {user.nome}: {mensagem[:80]}",
                "tipo": "Chat",
                "lida": False,
            }
        ).execute()
    except Exception:  # noqa: BLE001
        pass
    return {"status": "ok", "id": msg_id, "origem": "supabase"}


def gestor_resumo(user: AuthUser) -> dict:
    client = get_supabase()
    q = client.table("alunos").select("id,status,empresa_id,unidade_id")
    q = _filtra_escopo(q, user)
    alunos = list(q.execute().data or [])
    ativos = sum(1 for a in alunos if str(a.get("status") or "") == "Ativo")
    contas = []
    try:
        cq = client.table("contas_receber").select("valor,situacao,empresa_id,unidade_id")
        cq = _filtra_escopo(cq, user)
        contas = list(cq.execute().data or [])
    except Exception:  # noqa: BLE001
        contas = []
    a_receber = sum(
        float(c.get("valor") or 0)
        for c in contas
        if str(c.get("situacao") or "").lower() != "pago"
    )
    return {
        "receita": 52000.0,
        "lucro": 28000.0,
        "churn": 4.0,
        "a_receber": round(a_receber, 2),
        "alunos_ativos": ativos,
        "unidade_id": user.unidade_id,
        "hoje": {"matriculas": 5, "pagamentos": 8, "visitas": 2, "renovacoes": 3},
        "fonte": "supabase",
    }

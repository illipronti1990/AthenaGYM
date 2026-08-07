"""Semeia dados demo no Supabase (após 001 + 002 SQL)."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from dotenv import load_dotenv

load_dotenv()

from app.security import hash_senha  # noqa: E402
from app.supabase_client import get_supabase  # noqa: E402

MAT = "ATH-2026-000001"


def _upsert_empresas(client) -> None:
    client.table("empresas").upsert(
        [
            {
                "id": 0,
                "razao_social": "ATHENA PLATFORM LTDA",
                "nome_fantasia": "ATHENA PLATFORM",
                "cnpj": "00.000.000/0001-00",
                "plano": "Enterprise",
                "status": "Ativo",
                "cidade": "São Paulo",
                "estado": "SP",
                "email": "platform@athena.gym",
            },
            {
                "id": 1,
                "razao_social": "ATHENA GYM ACADEMIA LTDA",
                "nome_fantasia": "ATHENA GYM",
                "cnpj": "12.345.678/0001-90",
                "plano": "Enterprise",
                "status": "Ativo",
                "cidade": "São Paulo",
                "estado": "SP",
                "email": "contato@athena.gym",
                "data_expiracao": (datetime.now().astimezone() + timedelta(days=365)).isoformat(),
            },
        ]
    ).execute()


def _upsert_unidades(client) -> None:
    client.table("unidades").upsert(
        [
            {
                "id": 1,
                "empresa_id": 1,
                "nome": "ATHENA GYM Matriz",
                "codigo": "MX",
                "cidade": "São Paulo",
                "estado": "SP",
                "status": "Ativa",
                "responsavel": "Carlos Mendes",
            },
            {
                "id": 2,
                "empresa_id": 1,
                "nome": "ATHENA GYM Zona Sul",
                "codigo": "ZS",
                "cidade": "São Paulo",
                "estado": "SP",
                "status": "Ativa",
                "responsavel": "Ana Paula Souza",
            },
        ]
    ).execute()


def _ensure_users(client) -> None:
    users = [
        (0, 0, "super", "Super Admin Plataforma", "SuperAdmin", None),
        (1, 0, "admin", "Administrador", "Administrador", None),
        (1, 1, "aluno", "Mariana Oliveira", "Aluno", MAT),
        (1, 1, "professor", "Carlos Mendes", "Professor", None),
        (1, 1, "recepcao", "Recepção", "Recepção", None),
        (1, 1, "financeiro", "Financeiro", "Financeiro", None),
    ]
    for empresa_id, unidade_id, usuario, nome, perfil, matricula in users:
        existing = (
            client.table("usuarios")
            .select("id")
            .eq("empresa_id", empresa_id)
            .eq("usuario", usuario)
            .execute()
        )
        if existing.data:
            try:
                client.table("usuarios").update({"unidade_id": unidade_id}).eq(
                    "id", existing.data[0]["id"]
                ).execute()
            except Exception:  # noqa: BLE001
                pass
            continue
        payload = {
            "empresa_id": empresa_id,
            "unidade_id": unidade_id,
            "nome": nome,
            "usuario": usuario,
            "senha_hash": hash_senha("123456"),
            "perfil": perfil,
            "status": "Ativo",
            "matricula": matricula,
        }
        client.table("usuarios").insert(payload).execute()


def _ensure_aluno(client) -> None:
    aluno = (
        client.table("alunos")
        .select("id")
        .eq("empresa_id", 1)
        .eq("matricula", MAT)
        .execute()
    )
    if aluno.data:
        return
        client.table("alunos").insert(
            {
                "empresa_id": 1,
                "unidade_id": 1,
                "matricula": MAT,
                "nome": "Mariana Oliveira",
                "plano": "Premium",
                "professor": "Carlos Mendes",
                "status": "Ativo",
                "telefone": "(11) 98888-0001",
                "email": "mariana@demo.athena.gym",
                "data_cadastro": (date.today() - timedelta(days=120)).isoformat(),
            }
        ).execute()


def _ensure_treino(client) -> int | None:
    existing = (
        client.table("treinos")
        .select("id")
        .eq("matricula", MAT)
        .eq("status", "Ativo")
        .limit(1)
        .execute()
    )
    if existing.data:
        return int(existing.data[0]["id"])
    res = (
        client.table("treinos")
        .insert(
            {
                "matricula": MAT,
                "nome_aluno": "Mariana Oliveira",
                "divisao": "ABCD",
                "status": "Ativo",
                "comentario": "Foco em hipertrofia — progressão gradual.",
            }
        )
        .execute()
    )
    return int((res.data or [{}])[0]["id"]) if res.data else None


def _ensure_treino_itens(client, treino_id: int) -> None:
    existing = client.table("treino_itens").select("id").eq("treino_id", treino_id).limit(1).execute()
    if existing.data:
        return
    itens = [
        ("A", "Supino reto", "4", "10", 1),
        ("A", "Desenvolvimento ombro", "3", "12", 2),
        ("A", "Tríceps corda", "3", "15", 3),
        ("B", "Puxada frente", "4", "10", 1),
        ("B", "Remada curvada", "3", "12", 2),
        ("B", "Rosca direta", "3", "12", 3),
        ("C", "Agachamento livre", "4", "8", 1),
        ("C", "Leg press", "3", "12", 2),
        ("C", "Stiff", "3", "10", 3),
        ("D", "Prancha", "3", "40s", 1),
        ("D", "Abdominal infra", "3", "15", 2),
    ]
    rows = [
        {
            "treino_id": treino_id,
            "dia": dia,
            "exercicio": ex,
            "series": series,
            "repeticoes": reps,
            "ordem": ordem,
        }
        for dia, ex, series, reps, ordem in itens
    ]
    client.table("treino_itens").insert(rows).execute()


def _ensure_avaliacao(client) -> None:
    existing = client.table("avaliacoes").select("id").eq("matricula", MAT).limit(1).execute()
    if existing.data:
        return
    client.table("avaliacoes").insert(
        {
            "matricula": MAT,
            "data": (date.today() - timedelta(days=20)).isoformat(),
            "peso": 62.5,
            "imc": 22.1,
            "gordura": 24.0,
            "massa_magra": 47.5,
        }
    ).execute()


def _ensure_acessos(client) -> None:
    existing = client.table("acessos").select("id").eq("matricula", MAT).limit(1).execute()
    if existing.data:
        return
    rows = []
    for i in range(8):
        d = date.today() - timedelta(days=i * 2)
        rows.append(
            {
                "matricula": MAT,
                "data": d.isoformat(),
                "entrada": "07:15",
                "saida": "08:40",
                "status": "Liberado",
            }
        )
    client.table("acessos").insert(rows).execute()


def _ensure_contas(client) -> None:
    existing = (
        client.table("contas_receber")
        .select("id")
        .eq("matricula", MAT)
        .eq("competencia", date.today().strftime("%Y-%m"))
        .limit(1)
        .execute()
    )
    if existing.data:
        return
    hoje = date.today()
    mes_atual = hoje.replace(day=1)
    mes_ant = (mes_atual - timedelta(days=1)).replace(day=1)
    venc_atual = hoje.replace(day=10)
    client.table("contas_receber").insert(
        [
            {
                "empresa_id": 1,
                "matricula": MAT,
                "competencia": mes_ant.strftime("%Y-%m"),
                "valor": 189.9,
                "vencimento": (hoje - timedelta(days=25)).isoformat(),
                "situacao": "Pago",
            },
            {
                "empresa_id": 1,
                "matricula": MAT,
                "competencia": mes_atual.strftime("%Y-%m"),
                "valor": 189.9,
                "vencimento": venc_atual.isoformat(),
                "situacao": "Em dia",
            },
        ]
    ).execute()


def _ensure_meta(client) -> None:
    existing = client.table("metas_aluno").select("id").eq("matricula", MAT).limit(1).execute()
    if existing.data:
        return
    client.table("metas_aluno").insert(
        {
            "matricula": MAT,
            "objetivo": "Hipertrofia",
            "meta": 65.0,
            "atual": 62.5,
            "unidade": "kg",
        }
    ).execute()


def _ensure_notificacoes(client) -> None:
    existing = client.table("notificacoes").select("id").eq("usuario", "aluno").limit(1).execute()
    if existing.data:
        return
    client.table("notificacoes").insert(
        [
            {
                "usuario": "aluno",
                "matricula": MAT,
                "mensagem": "Seu treino ABCD foi atualizado pelo professor Carlos.",
                "tipo": "Treino",
                "lida": False,
            },
            {
                "usuario": "aluno",
                "matricula": MAT,
                "mensagem": "Mensalidade de julho está em dia. Obrigada!",
                "tipo": "Financeiro",
                "lida": False,
            },
            {
                "usuario": "admin",
                "matricula": MAT,
                "mensagem": "Sync cloud pronto — dados demo no Supabase.",
                "tipo": "Sistema",
                "lida": False,
            },
        ]
    ).execute()


def _ensure_chat(client) -> None:
    existing = client.table("chat").select("id").eq("matricula", MAT).limit(1).execute()
    if existing.data:
        return
    client.table("chat").insert(
        {
            "de_usuario": "professor",
            "para_usuario": "aluno",
            "matricula": MAT,
            "mensagem": "Mariana, aumente 2,5kg no supino na próxima semana.",
            "lida": False,
        }
    ).execute()


def main() -> None:
    client = get_supabase()
    _upsert_empresas(client)
    try:
        _upsert_unidades(client)
    except Exception as exc:  # noqa: BLE001
        print(f"Unidades: rode sql/003_epico2_unidades.sql — {exc}")
    _ensure_users(client)
    _ensure_aluno(client)

    try:
        treino_id = _ensure_treino(client)
        if treino_id:
            _ensure_treino_itens(client, treino_id)
        _ensure_avaliacao(client)
        _ensure_acessos(client)
        _ensure_contas(client)
        _ensure_meta(client)
        _ensure_notificacoes(client)
        _ensure_chat(client)
    except Exception as exc:  # noqa: BLE001
        print(f"Seed parcial — rode sql/002_portal_tables_supabase.sql primeiro: {exc}")
        raise

    print("Seed Supabase OK — empresas/usuarios/alunos + portal (treino/financeiro/chat)")


if __name__ == "__main__":
    main()

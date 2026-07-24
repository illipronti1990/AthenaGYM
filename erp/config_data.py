"""Dados mestres e massa de exemplo do ERP ATHENAS GYM."""

from datetime import date, timedelta

PLANOS = [
    ("Mensal", 129.90),
    ("Trimestral", 109.90),
    ("Semestral", 99.90),
    ("Anual", 89.90),
    ("Personal", 350.00),
    ("Day Use", 40.00),
]

FORMAS_PAGAMENTO = [
    "PIX",
    "Dinheiro",
    "Cartão Débito",
    "Cartão Crédito",
    "Boleto",
    "Transferência",
]

BANCOS = ["Nubank", "Inter", "Itaú", "Bradesco", "Caixa", "Santander", "Caixa Interna"]

CATEGORIAS_RECEITA = [
    "Mensalidades",
    "Matrículas",
    "Personal",
    "Avaliação Física",
    "Produtos",
    "Outros",
]

CATEGORIAS_DESPESA = [
    "Aluguel",
    "Energia",
    "Água",
    "Internet",
    "Funcionários",
    "Salários",
    "Marketing",
    "Equipamentos",
    "Limpeza",
    "Contador",
    "Impostos",
    "Produtos (Repos)",
    "Manutenção",
    "Outros",
]

STATUS_ALUNO = ["Ativo", "Congelado", "Cancelado", "Inadimplente"]
STATUS_PAGAMENTO = ["Pago", "Pendente", "Atrasado", "Vence hoje"]
STATUS_PROFESSOR = ["Ativo", "Férias", "Inativo"]
SEXOS = ["Masculino", "Feminino", "Outro"]
ESPECIALIDADES = [
    "Musculação",
    "Funcional",
    "Cross Training",
    "Yoga",
    "Pilates",
    "Personal Trainer",
    "Avaliação Física",
]

PRODUTOS = [
    ("Whey Protein 900g", "Suplementos", 20, 5, 89.90, 149.90),
    ("Creatina 300g", "Suplementos", 25, 5, 45.00, 79.90),
    ("Barra Proteica", "Suplementos", 40, 10, 6.50, 12.90),
    ("Camiseta Athenas", "Vestuário", 30, 5, 25.00, 69.90),
    ("Garrafa Squeeze", "Acessórios", 20, 5, 12.00, 39.90),
    ("Luvas Treino", "Acessórios", 15, 3, 18.00, 49.90),
]

PROFESSORES = [
    ("Carlos Mendes", "CREF 123456-G/SP", "(11) 98888-1001", "Musculação", 3500.00, "Ativo"),
    ("Ana Paula Souza", "CREF 234567-G/SP", "(11) 98888-1002", "Funcional", 3200.00, "Ativo"),
    ("Rafael Lima", "CREF 345678-G/SP", "(11) 98888-1003", "Personal Trainer", 4000.00, "Ativo"),
    ("Juliana Costa", "CREF 456789-G/SP", "(11) 98888-1004", "Avaliação Física", 3000.00, "Ativo"),
]

EQUIPAMENTOS = [
    ("Leg Press 45°", 2, date(2023, 3, 15), 8500.00, date(2026, 3, 15), date(2026, 5, 1)),
    ("Supino Reto", 3, date(2023, 4, 10), 2200.00, date(2026, 4, 10), date(2026, 8, 1)),
    ("Esteira Profissional", 4, date(2024, 1, 20), 12000.00, date(2027, 1, 20), date(2026, 4, 15)),
    ("Bicicleta Ergométrica", 3, date(2024, 2, 5), 4500.00, date(2027, 2, 5), date(2026, 9, 1)),
    ("Smith Machine", 1, date(2023, 6, 1), 9800.00, date(2026, 6, 1), date(2026, 3, 1)),
    ("Cadeira Extensora", 2, date(2023, 8, 12), 3100.00, date(2026, 8, 12), date(2026, 10, 1)),
    ("Puxada Alta", 2, date(2023, 9, 1), 2800.00, date(2026, 9, 1), date(2026, 7, 1)),
    ("Halteres (kit 1-40kg)", 1, date(2022, 11, 10), 15000.00, date(2027, 11, 10), date(2026, 12, 1)),
]


def _aluno(
    codigo: str,
    nome: str,
    cpf: str,
    sexo: str,
    nasc: date,
    whatsapp: str,
    email: str,
    plano: str,
    professor: str,
    valor: float,
    inicio: date,
    status: str,
) -> dict:
    termino = date(inicio.year + 1, inicio.month, min(inicio.day, 28))
    return {
        "codigo": codigo,
        "nome": nome,
        "cpf": cpf,
        "rg": f"{cpf[:2]}.{cpf[2:5]}.{cpf[5:8]}-{cpf[9:]}",
        "sexo": sexo,
        "nasc": nasc,
        "whatsapp": whatsapp,
        "telefone": whatsapp,
        "email": email,
        "cep": "01310-100",
        "rua": "Av. Paulista",
        "numero": "1000",
        "bairro": "Bela Vista",
        "cidade": "São Paulo",
        "plano": plano,
        "professor": professor,
        "valor": valor,
        # Sprint 3.4 — ATH-AAAA-000001
        "matricula": f"ATH-{inicio.year}-{int(codigo[1:]):06d}",
        "inicio": inicio,
        "termino": termino,
        "status": status,
    }


ALUNOS = [
    _aluno(
        "A001",
        "Mariana Oliveira",
        "529.982.247-25",
        "Feminino",
        date(1995, 4, 12),
        "(11) 99111-2201",
        "mariana.o@email.com",
        "Mensal",
        "Carlos Mendes",
        129.90,
        date(2026, 1, 5),
        "Ativo",
    ),
    _aluno(
        "A002",
        "Pedro Henrique Alves",
        "111.444.777-35",
        "Masculino",
        date(1990, 8, 22),
        "(11) 99111-2202",
        "pedro.h@email.com",
        "Trimestral",
        "Ana Paula Souza",
        109.90,
        date(2026, 2, 1),
        "Ativo",
    ),
    _aluno(
        "A003",
        "Fernanda Ribeiro",
        "390.533.447-05",
        "Feminino",
        date(1998, 1, 30),
        "(11) 99111-2203",
        "fernanda.r@email.com",
        "Semestral",
        "Rafael Lima",
        99.90,
        date(2025, 12, 10),
        "Ativo",
    ),
    _aluno(
        "A004",
        "Lucas Martins",
        "853.513.468-93",
        "Masculino",
        date(1988, 11, 5),
        "(11) 99111-2204",
        "lucas.m@email.com",
        "Anual",
        "Carlos Mendes",
        89.90,
        date(2025, 7, 15),
        "Congelado",
    ),
    _aluno(
        "A005",
        "Beatriz Nogueira",
        "075.482.701-19",
        "Feminino",
        date(2001, 6, 18),
        "(11) 99111-2205",
        "beatriz.n@email.com",
        "Mensal",
        "Juliana Costa",
        129.90,
        date(2026, 3, 1),
        "Ativo",
    ),
    _aluno(
        "A006",
        "Thiago Ferreira",
        "246.810.121-90",
        "Masculino",
        date(1993, 9, 9),
        "(11) 99111-2206",
        "thiago.f@email.com",
        "Personal",
        "Rafael Lima",
        350.00,
        date(2026, 1, 20),
        "Ativo",
    ),
    _aluno(
        "A007",
        "Camila Santos",
        "369.121.518-17",
        "Feminino",
        date(1997, 2, 14),
        "(11) 99111-2207",
        "camila.s@email.com",
        "Mensal",
        "Ana Paula Souza",
        129.90,
        date(2025, 10, 1),
        "Inadimplente",
    ),
    _aluno(
        "A008",
        "Gustavo Rocha",
        "481.216.243-20",
        "Masculino",
        date(1985, 12, 3),
        "(11) 99111-2208",
        "gustavo.r@email.com",
        "Trimestral",
        "Carlos Mendes",
        109.90,
        date(2026, 4, 1),
        "Ativo",
    ),
]


def gerar_mensalidades(hoje: date | None = None) -> list[dict]:
    hoje = hoje or date.today()
    rows: list[dict] = []
    for aluno in ALUNOS:
        if aluno["status"] == "Cancelado":
            continue
        for meses_atras in range(3, -1, -1):
            ref = hoje.replace(day=1) - timedelta(days=meses_atras * 28)
            competencia = date(ref.year, ref.month, 1)
            vencimento = date(competencia.year, competencia.month, min(10, 28))
            if vencimento.month != competencia.month:
                vencimento = date(competencia.year, competencia.month, 28)

            if meses_atras >= 2:
                status = "Pago"
                pagamento = vencimento - timedelta(days=2)
            elif meses_atras == 1:
                if aluno["status"] == "Inadimplente":
                    status = "Atrasado"
                    pagamento = None
                else:
                    status = "Pago"
                    pagamento = vencimento
            else:
                if vencimento == hoje:
                    status = "Vence hoje"
                    pagamento = None
                elif vencimento < hoje:
                    status = "Atrasado"
                    pagamento = None
                else:
                    status = "Pendente"
                    pagamento = None

            rows.append(
                {
                    "aluno": aluno["nome"],
                    "codigo": aluno["matricula"],
                    "competencia": competencia,
                    "valor": aluno["valor"],
                    "vencimento": vencimento,
                    "pagamento": pagamento,
                    "status": status,
                    "forma": "PIX" if status == "Pago" else "",
                }
            )
    return rows


def gerar_financeiro(hoje: date | None = None) -> list[dict]:
    hoje = hoje or date.today()
    lancamentos: list[dict] = []

    # Receitas de mensalidades pagas (espelho resumido)
    for i, aluno in enumerate(ALUNOS[:6]):
        dia = hoje - timedelta(days=5 + i * 3)
        lancamentos.append(
            {
                "data": dia,
                "tipo": "Receita",
                "categoria": "Mensalidades",
                "descricao": f"Mensalidade — {aluno['nome']}",
                "valor": aluno["valor"],
                "forma": "PIX",
                "banco": "Nubank",
                "aluno": aluno["nome"],
                "status": "Confirmado",
            }
        )

    lancamentos.extend(
        [
            {
                "data": hoje - timedelta(days=20),
                "tipo": "Receita",
                "categoria": "Matrículas",
                "descricao": "Taxa de matrícula — Beatriz Nogueira",
                "valor": 50.00,
                "forma": "PIX",
                "banco": "Inter",
                "aluno": "Beatriz Nogueira",
                "status": "Confirmado",
            },
            {
                "data": hoje - timedelta(days=12),
                "tipo": "Receita",
                "categoria": "Produtos",
                "descricao": "Venda Whey Protein 900g",
                "valor": 149.90,
                "forma": "Cartão Crédito",
                "banco": "Itaú",
                "aluno": "Pedro Henrique Alves",
                "status": "Confirmado",
            },
            {
                "data": hoje - timedelta(days=8),
                "tipo": "Receita",
                "categoria": "Avaliação Física",
                "descricao": "Avaliação — Mariana Oliveira",
                "valor": 80.00,
                "forma": "PIX",
                "banco": "Nubank",
                "aluno": "Mariana Oliveira",
                "status": "Confirmado",
            },
            {
                "data": hoje.replace(day=5),
                "tipo": "Despesa",
                "categoria": "Aluguel",
                "descricao": "Aluguel sala academia",
                "valor": 4500.00,
                "forma": "Transferência",
                "banco": "Itaú",
                "aluno": "",
                "status": "Confirmado",
            },
            {
                "data": hoje.replace(day=8),
                "tipo": "Despesa",
                "categoria": "Energia",
                "descricao": "Conta de energia",
                "valor": 980.00,
                "forma": "Boleto",
                "banco": "Caixa",
                "aluno": "",
                "status": "Confirmado",
            },
            {
                "data": hoje.replace(day=8),
                "tipo": "Despesa",
                "categoria": "Água",
                "descricao": "Conta de água",
                "valor": 220.00,
                "forma": "Boleto",
                "banco": "Caixa",
                "aluno": "",
                "status": "Confirmado",
            },
            {
                "data": hoje.replace(day=10),
                "tipo": "Despesa",
                "categoria": "Internet",
                "descricao": "Internet fibra",
                "valor": 149.90,
                "forma": "PIX",
                "banco": "Nubank",
                "aluno": "",
                "status": "Confirmado",
            },
            {
                "data": hoje.replace(day=5),
                "tipo": "Despesa",
                "categoria": "Salários",
                "descricao": "Folha professores",
                "valor": 13700.00,
                "forma": "Transferência",
                "banco": "Itaú",
                "aluno": "",
                "status": "Confirmado",
            },
            {
                "data": hoje - timedelta(days=15),
                "tipo": "Despesa",
                "categoria": "Marketing",
                "descricao": "Ads Instagram",
                "valor": 600.00,
                "forma": "Cartão Crédito",
                "banco": "Nubank",
                "aluno": "",
                "status": "Confirmado",
            },
            {
                "data": hoje - timedelta(days=3),
                "tipo": "Despesa",
                "categoria": "Limpeza",
                "descricao": "Material limpeza",
                "valor": 180.00,
                "forma": "Dinheiro",
                "banco": "Caixa Interna",
                "aluno": "",
                "status": "Confirmado",
            },
        ]
    )
    return sorted(lancamentos, key=lambda x: x["data"])


CONTAS_PAGAR = [
    {
        "fornecedor": "Imobiliária Central",
        "descricao": "Aluguel agosto",
        "valor": 4500.00,
        "vencimento": date(2026, 8, 5),
        "categoria": "Aluguel",
        "situacao": "Pendente",
    },
    {
        "fornecedor": "Enel SP",
        "descricao": "Energia julho",
        "valor": 980.00,
        "vencimento": date(2026, 7, 25),
        "categoria": "Energia",
        "situacao": "Atrasado",
    },
    {
        "fornecedor": "Contábil Plus",
        "descricao": "Honorários contábeis",
        "valor": 450.00,
        "vencimento": date(2026, 7, 30),
        "categoria": "Contador",
        "situacao": "Pendente",
    },
    {
        "fornecedor": "Nutri Distribuidora",
        "descricao": "Reposição whey/creatina",
        "valor": 1200.00,
        "vencimento": date(2026, 8, 10),
        "categoria": "Produtos (entrada)",
        "situacao": "Pendente",
    },
    {
        "fornecedor": "TechGym Manutenção",
        "descricao": "Manutenção esteiras",
        "valor": 650.00,
        "vencimento": date(2026, 7, 22),
        "categoria": "Manutenção",
        "situacao": "Atrasado",
    },
]

AVALIACOES = [
    ("Mariana Oliveira", date(2026, 1, 10), 68.5, 1.68, 24.2, 48.5, "Juliana Costa", "Boa evolução"),
    ("Mariana Oliveira", date(2026, 4, 10), 66.2, 1.68, 22.8, 50.1, "Juliana Costa", "Redução de gordura"),
    ("Pedro Henrique Alves", date(2026, 2, 5), 82.0, 1.78, 18.5, 66.0, "Juliana Costa", "Foco hipertrofia"),
    ("Fernanda Ribeiro", date(2026, 3, 1), 59.0, 1.62, 26.0, 42.0, "Juliana Costa", "Início protocolo"),
    ("Thiago Ferreira", date(2026, 1, 25), 90.5, 1.80, 16.0, 74.0, "Rafael Lima", "Personal 3x/semana"),
    ("Beatriz Nogueira", date(2026, 3, 8), 71.0, 1.70, 27.5, 49.0, "Juliana Costa", "Primeira avaliação"),
]

PRESENCAS = [
    ("Mariana Oliveira", date(2026, 7, 20), "07:00", "08:15", "Carlos Mendes"),
    ("Pedro Henrique Alves", date(2026, 7, 20), "18:00", "19:10", "Ana Paula Souza"),
    ("Fernanda Ribeiro", date(2026, 7, 20), "19:00", "20:00", "Rafael Lima"),
    ("Thiago Ferreira", date(2026, 7, 21), "06:30", "07:45", "Rafael Lima"),
    ("Beatriz Nogueira", date(2026, 7, 21), "12:00", "13:00", "Juliana Costa"),
    ("Gustavo Rocha", date(2026, 7, 21), "17:30", "18:40", "Carlos Mendes"),
    ("Mariana Oliveira", date(2026, 7, 21), "07:05", "08:20", "Carlos Mendes"),
    ("Camila Santos", date(2026, 7, 15), "08:00", "09:00", "Ana Paula Souza"),
]

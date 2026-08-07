# Arquitetura — Movvo Platform

## Visão oficial (Sprint 0–4 — SaaS + IAM + Students + Sales + Finance)

A partir do Sprint 0, o **produto oficial** é SaaS. Sprint 1 = IAM/RBAC. Sprint 2 = **Students**. Sprint 3 = funil **Comercial**. Sprint 4 = **Financeiro Enterprise** (receivables, payables, subscriptions, PIX, cashflow, DRE, conciliação).

```
MOVVO PLATFORM
      │
 Frontend Next.js (platform/apps/web)
      │ HTTPS /api/v1 + Bearer Supabase JWT
 NestJS (Students + Sales + Finance) ──writes──► outbox_events
      │                                              │
 Supabase Auth + PostgreSQL (RLS) + Storage          │ drain
                                                     ▼
                              Worker BullMQ (Redis) — emails/whatsapp/pdf/renew stubs
```

**PaymentProvider:** interface com Stub (default) + Asaas sandbox opcional. Webhooks com HMAC e `webhook_receipts` (idempotência).

**Funil comercial → financeiro:** `ContractSigned` → subscription + receivable → PIX/webhook → `PaymentConfirmed` → cash_movements + liberação (stub) + outbox notify.

| Papel | Stack | Pasta |
|-------|--------|--------|
| Produto oficial | Next.js + NestJS + Supabase + Worker | `platform/` |
| Sync Excel (legado) | FastAPI **congelado** | `cloud/api/` |
| Apoio ops / import-export | Excel VBA | `erp/`, `Excel/` |

Excel **não** é mais a plataforma principal. Domínio novo usa UUID + RLS + soft delete. Tabelas legado convivem sem drop.

Detalhes de setup: [`platform/README.md`](../platform/README.md).

---

# Arquitetura — ATHENA GYM ERP 2.0 (legado Excel)

## Visão

O ERP Excel continua como **software versionado** e canal de sync, não como produto SaaS.

```
ATHENA GYM/
├── Excel/                 # Releases do .xlsm (cópia pós-build)
├── Documentacao/          # Manuais, arquitetura, changelog
├── Export_VBA/            # Módulos .bas/.frm para Git
├── Backup/
├── Releases/
└── erp/                   # Gerador Python (fonte de build)
    ├── gerar_erp.py
    ├── vba/               # Fonte VBA (canônica para o gerador)
    └── ...
```

## Camadas

| Camada | Onde | Exemplos |
|--------|------|----------|
| Interface | Abas UI + UserForms | `00_LOGIN`, `frmLogin`, `frmAluno`, `frmSplash` |
| Negócio | Módulos VBA | `modAluno`, `modFinanceiro`, `modLogin` |
| Configuração | `modConfiguracao` + mestras | `ObterParametro`, planos, formas, cores |
| Dados | `modBanco` apenas | ListObjects `tb*` |
| Segurança | `modSistema` + `BD_PERMISSOES` | Matriz perfil × módulo |
| Auditoria | `modLog` + `LOG` | Ação + módulo + computador + versão |

## Multi-Tenant SaaS (Épico 1)

```
MOVVO PLATFORM (EmpresaID=0 SuperAdmin)
        │
   BD único + EmpresaID
   ├── Empresa 1 ATHENA GYM
   ├── Empresa 2 …
   └── Isolamento por sessão
```

- Docs: `Documentacao/Dicionario_de_Dados.md`
- Excel: `38_MASTER`, `39_NOVA_ACADEMIA`, `modEmpresa`
- Cloud: `empresas`, `licencas`, `config_empresa` + filtro por tenant

## ATHENA AI (Sprint 12.0)

```
                  ATHENA GYM ERP
             Banco de Dados Central
                     │
              Motor ATHENA AI (modAthenaAI)
      ┌──────────────┼──────────────┐
   Financeira    Comercial     Operacional
      └──────────────┼──────────────┘
              Assistente 36_ATHENA_AI
              Central 37_RECOMENDACOES
```

- Perguntas em linguagem natural (rule-based): receita, risco, estoque, pico, churn, previsão
- Recomendações priorizadas (🔴🟠🟡🟢🔵) em `BD_RECOMENDACOES`
- Reusa motores BI (`modBIAnalytics`) + CRM/Estoque/Acesso
- Filas WhatsApp / E-mail na própria tela Athena

## Portal + Cloud (Sprint 11 + SQL)

```
Excel ERP (modPortal.Sincronizar)
        ↓
 Sync/portal_export.json
        ↓
 FastAPI (contrato)
        ↓
 SQL — fonte da verdade (SQLite local / PostgreSQL)
   ├── Portal Web
   └── App Flutter
```

- UI Excel: `33_PORTAL_ALUNO`, `34_PORTAL_PROF`, `35_PORTAL_OPS`
- Tabelas cloud: `usuarios`, `alunos`, `treinos`, `acessos`, `contas_receber`, `chat`, `notificacoes`, …
- Sync: `POST /sync/import` upserta alunos no SQL
- Docs: `cloud/README.md`

## Business Intelligence (Sprint 10.0)

```
ERP (dados) → Motor BI (modBI + modBIAnalytics)
                    ↓
         Dashboards · Alertas · Previsões · Insights
                    ↓
              Painel Executivo (31) + Insights (32)
```

- `BD_INDICADORES`, `BD_INSIGHTS`, `BD_PREVISOES`, `BD_RISCO_RETENCAO`
- KPIs estratégicos: Receita, Lucro, Churn, LTV, CAC, Ticket, Frequência
- Simulador: Premium +% · +1 professor
- Abas: `31_BI_EXECUTIVO`, `32_INSIGHTS` (numeração legada mantida)

## PDV e Estoque (Sprint 9.0)

```
Fornecedor → Compra → BD_MOVIMENTACAO_ESTOQUE → BD_PRODUTOS
                                              ↓
                                            PDV (carrinho / kits)
                                              ↓
                         Financeiro / Fluxo / Dashboard / Mensalidade (aluno)
```

- UI: `28_PDV`, `29_INVENTARIO`, `30_DASH_PDV` (+ sync `09_ESTOQUE`)
- Módulos: `modEstoque`, `modPDV`
- `BD_UNIDADES` desde o início (expansão multi-filial)
- Params: `Estoque/UnidadePadrao`, `DiasAlertaValidade`, `PerguntarMensalidade`

## Controle de Acesso e Frequência (Sprint 8.0)

```
Aluno → Controle de Acesso → Validação Financeira
                           → Libera / Bloqueia
                           → BD_ACESSOS + BD_PRESENCAS
                           → Dashboard Frequência
                           → Ausentes → CRM (retenção)
Pagamento → Conta Recebida → Liberar Acesso
```

- UI: `26_ACESSO`, `27_DASH_FREQUENCIA`
- Módulos: `modAcesso`, `modIntegracoes` (stub V2)
- Params: `Acesso/BloquearInadimplente`, `DiasTolerancia`, `PermitirLiberacaoManual`, etc.

## Treinos e Avaliação Física (Sprint 7.0)

```
Aluno → Avaliação → BD_AVALIACOES + BD_MEDIDAS
                 → Agenda (reavaliação 60 dias)
                 → Comparação / Evolução / PDF

Aluno → Treino → BD_TREINOS (versões)
              → BD_TREINO_ITENS (ficha A/B/C…)
              → BD_EXERCICIOS (biblioteca)
```

- UI: `24_AVALIACAO`, `25_TREINOS`
- Módulos: `modAvaliacao`, `modTreinos`

## CRM Inteligente (Sprint 6.0)

```
Lead → Contato → Experimental → Proposta → Matrícula
                      ↓
              BD_LEADS + Histórico
                      ↓
         ConverterLead (automático)
                      ↓
    Aluno → Mensalidade → Financeiro → BI → LOG
```

- Operação: `22_CRM` · Dashboard: `23_DASH_CRM`
- Retenção: `BD_RETENCAO` + identificação automática de risco
- Campanhas / Indicações com bônus no financeiro

## Operation Center (Sprint 5.1.1)

```
BD_* + Agenda + BI
        ↓
  BD_PRIORIDADES (peso)
        ↓
   modPainel.GerarAcoesDia
        ↓
     21_HOME  ← pós-login
        ↓
 AbrirModulo (filtro AutoFilter)
```

- Ações do dia ordenadas por peso (crítico → informativo).
- Notificações e KPIs por perfil (Admin / Recepção / Financeiro / Professor).
- Nada é digitado na HOME: só regras.

## Agenda Inteligente (Sprint 5.1)

```
Alunos / Financeiro / Estoque / Equipamentos / Professores
                         ↓
                   BD_EVENTOS
                         ↓
              20_AGENDA + Dashboard
                         ↓
                     modAgenda
```

Eventos automáticos: mensalidade (−5/0/atraso), avaliação, manutenção, estoque mínimo, renovação (fidelidade), aniversário, professor em férias.

## BI / Dashboard 360° (Sprint 5.0)

```
Dashboards (6)
      ↓
   BI_BASE   ← camada consolidada (equivalente Power Query nesta fase)
      ↓
  BD_* + razão + metas
      ↓
    modBI
```

- Semáforos e alertas no login.
- Metas em `BD_METAS` com progresso %.
- Filtros em `BI_BASE!B2:B7` (botão Filtros no Executivo).
- Evolução futura: PivotTables/Slicers nativos do Excel sobre `BI_BASE`.

## Motor financeiro (Sprint 4.0)

```
Aluno → Mensalidade → Conta a Receber → Recebimento
                              ↓
                     BD_LANCAMENTOS (razão)
                              ↓
              Fluxo de Caixa + Dashboard + DRE
```

- Eventos financeiros são **append-only** em `BD_LANCAMENTOS`.
- Multa/juros vêm de `ObterParametro("Financeiro", ...)`.
- UI operacional: `04_FINANCEIRO` + `frmReceber`.

## Motor de configuração (Sprint 3.5)

```vb
ObterParametro("Financeiro", "Multa")           ' → 2
ObterParametro("Sistema", "PrefixoMatricula")   ' → ATH
```

Tabelas mestras:

- `BD_PARAMETROS` — regras do sistema
- `BD_PLANOS` — valor, taxa matrícula, vencimento, fidelidade
- `BD_FORMAS_PAGAMENTO` — taxa e compensação
- `BD_STATUS` — listas de ComboBox
- `BD_PERMISSOES` — matriz de acesso
- `BD_CORES` — identidade visual
- `VERSAO` — changelog interno

## Regra de ouro

Nenhuma regra de negócio deve ficar “fixa” no VBA se puder viver em tabela.

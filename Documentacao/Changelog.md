# Changelog — ATHENA GYM ERP / PLATFORM

## Platform — 07/08/2026 — Sprint G-15 SaaS / White Label / Billing

- Migration `20260809_0001_saas_g15.sql`: companies SaaS, domains, plans/features/limits, billing stub, flags, tickets
- API `platform/tenants` + `saas-billing` + API key rotate/revoke + webhook replay; branding por Host
- Web `/app/platform/*` (dashboard, tenants, plans, billing, portal, keys, webhooks, flags, reports)
- Marketplace IDOR harden + CompanyGuard sync `companyId` + RLS PaaS
- Playwright `saas.g15.smoke.spec.ts` · docs `MOVVO_SAAS_G15.md`

## Platform — 07/08/2026 — Sprint G-14 Backoffice Admin

- Migration `20260808_0001_admin_g14.sql`: employees/HR, escalas, patrimônio, OS, docs, ocorrências, mural, settings + `admin.*` perms + bucket `admin-documents`
- Nest `AdminModule` (`/api/v1/admin/*`) + roles write/matriz + cost centers PATCH/soft-delete/category
- Web `/app/admin/*` (dashboard, colaboradores, cargos, escalas, patrimônio, manutenções, documentos, ocorrências, comunicados, calendário, centros-custo, config, relatórios)
- `/app/roles` → redirect `/app/admin/cargos`
- Playwright `admin.g14.smoke.spec.ts` · docs `MOVVO_ADMIN_G14.md`

## Platform — 07/08/2026 — Fase M-4 UX / Qualidade

- PageState + ConfirmProvider (sem `window.confirm`); densidade/skip-link
- Palette AbortController; notificações com filtros/mark-all; busca ampliada
- Dashboard lazy charts + prefs; tour guiado staff; Playwright `ux.m4.smoke`
- Docs `MOVVO_UX_M4.md`

## Platform — 07/08/2026 — Fase M-3 Comercial

- Planos enriquecidos + `/demonstracao` → obrigado; leads com status CRM e campos comerciais
- Conteúdo público: `/ajuda`, `/blog`, `/sobre`, `/status`, `/developers` + sitemap
- CRM ops `/app/commercial` (+ analytics, onboarding, templates) + Resend mailer
- Materiais em `Documentacao/comercial/` + PDF one-pager autenticado
- Playwright `commercial.m3.smoke.spec.ts` · docs `MOVVO_COMMERCIAL_M3.md`

## Platform 0.5.0 — 22/07/2026 — Sprint 4 Financeiro Enterprise

- Schema: accounts, cost centers, suppliers, subscriptions, receivables/payables, payment_transactions, invoices, bank statements, cash_movements, outbox_events, webhook_receipts + RLS
- Permissões: `finance.update|pay|refund|reconcile|reports` (+ seeds admin/finance)
- Nest `FinanceModule`: dashboard, AR/AP, assinaturas, PIX (PaymentProvider Stub/Asaas), webhooks HMAC+idempotência, cashflow, DRE, conciliação OFX/CSV
- Domain events + Outbox; `sales.contract_signed` cria subscription + 1ª cobrança
- `apps/worker` BullMQ/Redis: drain outbox, filas charges/emails/whatsapp/reports/reminders (stubs)
- Web: `/app/finance/*` + nav Financeiro
- Testes: Jest calc/HMAC + Playwright finance smoke
- docker-compose Redis

## Platform 0.4.0 — 22/07/2026 — Sprint 3 Sales / CRM / Matrículas

- Schema comercial: `lead_sources`, `pipeline_stages`, `leads`, `lead_activities`, `plans`, `enrollments`, `contracts` + RLS + bucket `contracts`
- Seed: fontes, 9 etapas de pipeline, planos Mensal/Trimestral/Semestral/Anual; permissões `sales.*`
- Nest `SalesModule`: leads, Kanban move stage, plans, enrollments, contracts (PDF texto + sign), dashboard KPIs
- Fechamento via EventEmitter (`contract.signed` → student/enrollment + stubs Finance/Welcome/App); porta documentada para BullMQ futuro
- Web: `/app/sales` (dashboard, leads, pipeline, plans, enrollments, contracts) + nav **Comercial**
- Testes: Jest KPI/stage/sign rules + Playwright sales smoke

## Platform 0.3.0 — 22/07/2026 — Sprint 2 Students

- Schema canônico `students` + addresses/contacts/documents/status_history + RLS
- Backfill one-shot `alunos` (empresa_id=1) → `students` (`legacy_aluno_id`); legado intacto
- Nest `StudentsModule`: CRUD, search, status, transfer, foto/docs Storage, CSV import/export, EventEmitter stubs
- Web: `/app/students` lista/filtros, novo, perfil + componentes reutilizáveis
- Storage buckets `student-photos` / `student-documents`
- Testes: Jest CPF + Playwright students smoke

## Platform 0.2.0 — 22/07/2026 — Sprint 1 IAM

- RBAC: `roles`, `permissions`, `role_permissions`, `user_roles`, `invites`, `audit_logs` + RLS
- Profiles: `company_id`, `default_unit_id`, `phone`, `status`, `last_login_at`, locale/timezone
- Nest: `JwtAuthGuard` + contexto enriquecido; `RolesGuard` / `PermissionsGuard` / `CompanyGuard` / `UnitGuard`
- API: `/auth/me|invite|accept|change-password|reset-password|profile`, `/users`, `/roles`, `/permissions`
- Web: login (lembrar + stubs MFA/social), forgot, accept-invite, profile, users, roles + toast/skeleton/error boundary/session timeout
- Testes: Jest guards + Playwright smoke (`platform/tests`)

## Platform 0.1.0 — 22/07/2026 — Sprint 0 Fundação SaaS

- Monorepo `platform/` — Next.js (`apps/web`) + NestJS (`apps/api`) + `@athena/shared`
- Schema canônico UUID: `companies`, `units`, `profiles`, `memberships` + RLS
- API oficial `/api/v1` (health, me, companies, units) + Swagger `/api/v1/docs`
- Auth: JWT Supabase · shell login Next.js `/login` + `/app`
- FastAPI `cloud/api` **congelado** (Excel sync)
- CI: `.github/workflows/platform-ci.yml`

## 5.0.0 — 22/07/2026 — Épico 3 Sprint A+B (Franquias)

- Hierarquia: Holding → Franqueadora → Franqueado → Empresa → Unidade
- `BD_FRANQUEADORAS`, `BD_FRANQUEADOS`, `BD_CONTRATOS_FRANQUIA`, `BD_ROYALTIES`
- UI `41_FRANQUEADORA` + `modFranquias` (cadastro, royalties, ranking, relatório)
- Sessão: FranqueadoraID / FranqueadoID · perfis `Franqueadora` / `Franqueado`
- `BD_EMPRESAS` + FranqueadoraID/FranqueadoID · empresas Campinas/Santos seed
- Gate Enterprise `Franquias` · Cloud API **0.19.0** + SQL `005_epico3_franquias.sql`
- Logins demo: `franqueadora` / `123456`, `franqueado` / `123456`

## 4.1.0 — 22/07/2026 — Épico 2 Sprint C/D (Transferências + KPIs + Permissões)

- `BD_TRANSFERENCIAS` + `TransferirEstoque` / `TransferirEstoqueEntreUnidades` (saída origem + entrada destino + clone SKU)
- `BD_PROFESSOR_UNIDADE` + `VincularProfessorUnidade` / `ProfessorAtuaNaUnidade`
- `BD_USUARIO_UNIDADE` + `PodeVerUnidade` (TrocarUnidade respeita vínculo)
- Filtros por sessão: estoque UI, PDV, agenda, CRM leads, KPIs Portal/Master
- `40_UNIDADES` com KPIs comparativos (`AtualizarDashboardUnidades`)
- Gate Enterprise: módulo `Multiunidade`
- Cloud API **0.18.0** + SQL `004_epico2_sprint_cd.sql` · listagens filtram `unidade_id`

## 4.0.0 — 22/07/2026 — Épico 2 Multiunidade (Filiais)

Empresa → Unidades → dados operacionais:

- `BD_UNIDADES` expandida (Código MX/ZS, endereço, responsável, Status Ativa)
- `BD_PARAMETROS_UNIDADE` · UI `40_UNIDADES` · `modUnidades` (Cadastrar / Trocar / Editar)
- `UnidadeID` no núcleo: Alunos, Contas, Lançamentos, Usuários, Estoque/PDV
- Sessão: UnidadeID + NomeUnidade (0 = todas as unidades)
- Matrícula nova: `ATH-{CODIGO}-######` (legado `ATH-AAAA-######` permanece)
- Cloud API 0.17.0 + SQL `003_epico2_unidades.sql` · sync grava `unidade_id`

## 3.0.0 — 22/07/2026 — Épico 1 Multi-Tenant (SaaS)

Arquitetura multi-empresa (banco único + `EmpresaID`):

- `BD_EMPRESAS`, `BD_LICENCAS`, `BD_CONFIG_EMPRESA`
- `BD_USUARIOS.EmpresaID` + SuperAdmin (`super` / `123456`, EmpresaID=0)
- Sessão: EmpresaID, NomeEmpresa, PlanoEmpresa
- Núcleo com EmpresaID: Alunos, Contas Receber/Pagar, Lançamentos, Unidades
- UI: `38_MASTER`, `39_NOVA_ACADEMIA` · `modEmpresa`
- Planos Basic / Pro / Enterprise (gates de menu)
- Cloud API 0.13.0: models Empresa/Licenca + `empresa_id` no login
- Dicionário: `Documentacao/Dicionario_de_Dados.md`

## 2.9.0 — 22/07/2026 — Sprint 12.0

ATHENA AI + Automação Total + Central de Recomendações:

- UI: `36_ATHENA_AI` (chat + briefing + previsões + automações), `37_RECOMENDACOES`
- Banco: `BD_RECOMENDACOES`, `BD_ATHENA_CHAT` (+ reuso `BD_INSIGHTS` / `BD_PREVISOES` / `BD_RISCO_RETENCAO`)
- `modAthenaAI` — AnalisarFinanceiro/CRM/Estoque/Treinos/Retenção, ResponderPergunta, AtualizarRecomendacoes, GerarRelatorioIA
- Menu **🤖 Athena** · botões Perguntar / Atualizar / Relatório IA
- Automações: fila WhatsApp (cobrança/reavaliação) + e-mail relatório executivo
- Params `Athena/*` (dias treino desatualizado, abrir no login)
- Plataforma Enterprise Excel completa (Sprints 1–12)

## 2.8.0 — 22/07/2026 — Sprint 11.0 (+ SQL Foundation cloud)

Portal do Aluno + API Cloud + App Mobile (fundação) **e evolução SQL**:

- Excel: `33_PORTAL_ALUNO`, `34_PORTAL_PROF`, `35_PORTAL_OPS`
- `BD_CHAT`, `BD_METAS_ALUNO`, `BD_PORTAL_TOKENS`, `BD_DESAFIOS`, `BD_PUSH`
- `modPortal` — login portal, chat, push, sync JSON
- Cloud API **com SQLAlchemy**: SQLite (dev) / PostgreSQL (docker compose)
- Fonte da verdade cloud: `cloud/api/data/athena.db` (ou Postgres)
- `POST /sync/import` — Excel JSON → upsert SQL
- Portal Web e Flutter consomem a mesma API

Arquitetura: Excel VBA (ops) + FastAPI (contrato) + SQL (store) + Web/App (clientes).

## 2.7.0 — 22/07/2026 — Sprint 10.0

Business Intelligence + Inteligência Analítica:

- `BD_INDICADORES` — valor, meta, tendência, variação
- `BD_INSIGHTS` / `BD_PREVISOES` / `BD_RISCO_RETENCAO`
- `31_BI_EXECUTIVO` — resumo executivo, LTV/CAC, previsão de caixa, metas, ranking
- `32_INSIGHTS` — central de insights, retenção, compras inteligentes, simulador
- `modBIAnalytics` — previsões, retenção, estoque inteligente, simulador financeiro
- `modBI.AtualizarBI` orquestra a camada analítica
- Novos KPIs: LTV, CAC, frequência %, saúde estoque, previsão receita/caixa
- Params `BI/*` (CAC estimado, risco, abrir executivo no login)

> Numeração de abas preservada (21_HOME, 01_DASHBOARD…). O mapa conceitual da Sprint (01–12) corresponde ao menu funcional, sem renumerar o workbook.

## 2.6.0 — 22/07/2026 — Sprint 9.0

PDV Inteligente + Gestão de Estoque:

- `BD_PRODUTOS`, `BD_FORNECEDORES`, `BD_COMPRAS`, `BD_MOVIMENTACAO_ESTOQUE`
- `BD_LOTES`, `BD_VENDAS`, `BD_VENDA_ITENS`, `BD_KITS`, `BD_KIT_ITENS`
- `BD_UNIDADES` — preparação multi-filial (Matriz + Zona Sul planejada)
- `28_PDV` — carrinho, kits, PIX/Cartão/Dinheiro, venda para aluno → mensalidade
- `29_INVENTARIO` — contagem física com ajuste automático
- `30_DASH_PDV` — KPIs, ranking, curva ABC, alertas de reposição/validade
- `modEstoque` + `modPDV` — movimentações obrigatórias, sync `09_ESTOQUE`, painel REPOR
- Venda → baixa estoque → receita/caixa → dashboard → LOG
- Parâmetros `Estoque/*`

## 2.5.0 — 22/07/2026 — Sprint 8.0

Controle de Acesso, Presença e Frequência:

- `BD_ACESSOS` — entradas/saídas, tempo, forma, status (Liberado/Bloqueado)
- `BD_PRESENCAS` — resumo rápido para consultas e dashboards
- `26_ACESSO` — recepção: matrícula/CPF, validação financeira, liberar/bloquear
- `27_DASH_FREQUENCIA` — KPIs, pico horário, ranking, ausentes, faixas
- `modAcesso` — ValidarEntrada, RegistrarEntrada/Saída, ausentes → CRM
- `modIntegracoes` — stub V2 (QR, biometria, RFID, catraca, WhatsApp, PIX)
- Pagamento → `AtualizarAcessoAposPagamento` (libera sem ação manual)
- Parâmetros `Acesso/*` e `Integracoes/*` em `BD_PARAMETROS`

## 2.4.0 — 22/07/2026 — Sprint 7.0

Gestão de Treinos e Avaliação Física:

- `BD_AVALIACOES` + `BD_MEDIDAS` — histórico append-only + circunferências
- `BD_TREINOS` + `BD_TREINO_ITENS` + `BD_EXERCICIOS` — fichas versionadas e biblioteca
- `BD_FOTOS` — caminhos de imagens (frente/lado/costas)
- `24_AVALIACAO` — ficha, evolução, comparação A×B, reavaliação em 60 dias
- `25_TREINOS` — treinos, divisão ABC…, cópia de versão, exercícios
- `modAvaliacao` + `modTreinos` — IMC, PDF, sync legado `11_AVALIACAO`, agenda
- Parâmetro `Treinos/DiasReavaliacao` = 60

## 2.3.0 — 22/07/2026 — Sprint 6.0

CRM Inteligente — leads → matrícula → retenção:

- `BD_LEADS` + `BD_CRM_HISTORICO` — funil e timeline
- `BD_RETENCAO` — alunos em risco (presença, atraso, frequência)
- `BD_CAMPANHAS` + `BD_INDICACOES` — marketing e bônus
- `22_CRM` — operação (agenda comercial, leads, histórico)
- `23_DASH_CRM` — KPIs, origem, ranking, funil, campanhas
- `modCRM` — NovoLead, Contato, Experimental, Proposta, ConverterLead
- Conversão automática: lead → aluno → mensalidade → financeiro → BI → LOG
- Parâmetros `CRM/*` (dias sem presença, bônus indicação, etc.)

## 2.2.2 — 21/07/2026 — Sprint 5.1.1

Operation Center — Painel de Ações do Dia:

- `21_HOME` — primeira tela pós-login (prioridades do dia)
- `BD_PRIORIDADES` — motor de peso (mensalidade 100 → experimental 50)
- `modPainel` — gera ações, notificações, KPIs por perfil, abre módulo filtrado
- Centro de notificações por módulo (Financeiro / Estoque / Equipamentos / Agenda / Alunos)
- Painéis por perfil: Admin, Recepção, Financeiro, Professor
- Clique / duplo-clique na ação → abre destino com filtro (ex.: Atrasado, REPOR)
- Fluxo automático: pagamento → BI → Agenda → Painel (sem preenchimento manual)

## 2.2.1 — 21/07/2026 — Sprint 5.1

Agenda Inteligente / Central Operacional:

- `BD_EVENTOS` — motor de eventos unificado
- `20_AGENDA` — hoje, semana, alertas, aniversariantes
- `modAgenda` — geração automática (mensalidade, avaliação, estoque, manutenção, renovação, aniversário)
- Notificação matinal no login com prioridades do dia
- Painel "Eventos de hoje" no Dashboard Executivo

## 2.2.0 — 21/07/2026 — Sprint 5.0

Dashboard Executivo 360° + BI:

- `BI_BASE` — camada consolidada (estilo Power Query)
- `BD_METAS` + progresso + semáforos 🟢🟡🔴
- `BD_NOTIFICACOES` — centro de alertas
- 6 dashboards: Executivo, Comercial, Financeiro, Professores, Estoque, Equipamentos
- `modBI` — KPIs, rankings, alertas inteligentes no login
- Filtros (período, professor, plano, aluno, unidade) em `BI_BASE`

## 2.1.0 — 21/07/2026 — Sprint 4.0

Motor financeiro inteligente (livro-razão):

- `BD_CONTAS_RECEBER` completo (multa, juros, valor final, competência)
- `BD_LANCAMENTOS` — eventos imutáveis (débito/crédito)
- `BD_FLUXO_CAIXA` append-only + `BD_CONTAS_PAGAR`
- `ReceberPagamento` com conciliação de desconto
- Cálculo automático de multa/juros (parâmetros)
- Hub `04_FINANCEIRO` + `frmReceber`
- KPIs: receita hoje/mês/ano, lucro, saldo, inadimplência, ticket, churn
- Estorno e cancelamento com LOG

## 2.0.1 — 21/07/2026 — Sprint 3.5

Motor de configuração (core do sistema):

- `BD_PARAMETROS` com Grupo | Parâmetro | Valor | Descrição
- `ObterParametro("Grupo","Parâmetro")` em `modConfiguracao`
- Novas mestras: `BD_PLANOS`, `BD_FORMAS_PAGAMENTO`, `BD_STATUS`, `BD_PERMISSOES`, `BD_CORES`
- Aba `VERSAO` (histórico de releases)
- LOG expandido (Módulo, Registro, Computador, Versão)
- Splash Screen (`frmSplash`) antes do login
- Permissões lidas de `BD_PERMISSOES` (sem `If Perfil =` hardcoded)
- Combos de plano/forma carregados das mestras
- Estrutura de pastas: `Excel/`, `Documentacao/`, `Export_VBA/`, `Backup/`, `Releases/`

## 2.0.0 — 21/07/2026 — Sprints 3.1–3.4

- Login real (`BD_USUARIOS` + `frmLogin`)
- Cadastro de alunos (`frmAluno` + `BD_ALUNOS`)
- Arquitetura MVC VBA (`modBanco` como única camada de dados)
- Matrícula `ATH-AAAA-000001` via parâmetros

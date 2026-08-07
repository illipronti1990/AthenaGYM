# Movvo ERP — Documento Técnico de Arquitetura (legado Excel)

**Versão:** 3.0 (histórico VBA/Excel)  
**Produto atual:** Movvo ERP (web/API em `platform/`)  
**Artefato legado:** `ATHENA_GYM_ERP_COMERCIAL.xlsm` (congelado)  
**Objetivo:** padrões históricos para manutenção do Excel; o produto SaaS é Movvo.

---

## 1. Visão da arquitetura

Separação em quatro camadas:

| Camada | Conteúdo | Responsabilidade |
|--------|----------|------------------|
| Interface | `00_LOGIN`, `01_DASHBOARD`, `FORM_*`, UserForms | Captura de input e navegação |
| Banco de Dados | `BD_*` (+ abas legadas `02_`…`15_`) | Persistência |
| Módulos VBA | `mod*` | Regras, validação, permissão, CRUD |
| UserForms | `frm*` | Diálogos (login, futuros cadastros) |

### Mapa de migração (incremental)

| Atual | Alvo (roadmap) | Fase 3 |
|-------|----------------|--------|
| Login hardcoded | `BD_USUARIOS` + `frmLogin` | **Feito** |
| Monólito VBA | Camadas MVC (modSistema…modAluno) | **Feito (Sprint 3.3)** |
| Sessão em `15_CONFIG!V20/V21` | `BD_SESSAO` | **Feito** |
| Aba `LOG` | `LOG` + `tbLog` | **Feito (Sprint 3.1)** |
| `ModuloAthena` monolítico | `modLogin`, `modAluno`, … | Parcial (auth extraído) |
| `02_ALUNOS` | `BD_ALUNOS` (`tbAlunos`) + lista `02_ALUNOS` | **Feito (Sprint 3.2)** |
| `04_FINANCEIRO` | `BD_FINANCEIRO` + `FORM_FINANCEIRO` | Futuro |

---

## 2. Convenção de nomes

| Tipo | Padrão | Exemplos |
|------|--------|----------|
| Interface | `00_` / `FORM_` | `00_LOGIN`, `FORM_ALUNO` |
| Banco | `BD_` / `LOG` | `BD_USUARIOS`, `BD_SESSAO`, `BD_ALUNOS`, `BD_CONTAS_RECEBER`, `BD_PARAMETROS`, `LOG` |
| Módulo VBA | `mod` + domínio | `modLogin`, `modPermissoes` |
| UserForm | `frm` + domínio | `frmLogin` |
| Constante | `CONST_` | `CONST_PERFIL_ADMIN` |
| Sessão | nomes claros | `UsuarioLogado`, `PerfilUsuario` |
| Shape de menu | `mnu` + chave | `mnuFinanceiro` |
| Macro de navegação | `Ir` + destino | `IrDashboard` |

---

## 3. Estrutura dos módulos VBA

| Módulo | Responsabilidade |
|--------|------------------|
| `modUtil` | Formatação, UUID, mensagens |
| `modValidacao` | CPF, telefone, e-mail, obrigatórios |
| `modSessao` | Variáveis de sessão + espelho |
| `modBanco` | **Único** acesso a ListObjects/células |
| `modLog` | `RegistrarLog` / `RegistrarErro` / login-logout |
| `modConfiguracao` | Parâmetros (`15_CONFIG`) |
| `modSistema` | App mode, permissões, menus, navegação |
| `modLogin` | Autenticação (`frmLogin`) |
| `modMensalidade` | Geração de mensalidades |
| `modFinanceiro` | Contas a receber, recibo, estoque→caixa |
| `modDashboard` | Atualização de KPIs |
| `modRelatorio` | PDFs e alertas |
| `modAluno` | Regras de negócio de alunos |
| `ThisWorkbook` | `Workbook_Open`, `Workbook_SheetActivate` |

**Regra MVC:** View (`FORM_ALUNO`/`frmLogin`) → Negócio (`modAluno`…) → Dados (`modBanco`) → `BD_*`.

---

## 4. Matriz de permissões

Recursos (chaves usadas em `modSistema`):

| Recurso | Administrador | Financeiro | Recepção | Professor |
|---------|---------------|------------|----------|-----------|
| `Dashboard` | sim | sim | sim | sim |
| `Alunos` | sim | leitura* | CRUD | consulta* |
| `Mensalidades` | sim | sim | receber* | não |
| `Financeiro` | sim | sim | não | não |
| `Estoque` | sim | não | não | não |
| `Professores` | sim | não | não | consulta* |
| `Relatorios` | sim | fin.* | alunos* | presença* |
| `Config` | sim | não | não | não |
| `Excluir` | sim | não | não | não |
| `Presenca` | sim | não | não | sim |
| `Avaliacao` | sim | não | não | sim |

\* Na Fase 3 o enforcement é por **acesso à aba/macro**; refinamento de “somente leitura” nos formulários fica no roadmap.

Abas protegidas (ativação bloqueada se perfil não autorizado):

- Financeiro: `04_FINANCEIRO`, `05_FLUXO_CAIXA`, `06_CONTAS_RECEBER`, `07_CONTAS_PAGAR`, `13_DASH_FINANCEIRO`
- Estoque: `09_ESTOQUE`, `10_EQUIPAMENTOS`
- Config: `15_CONFIG`, `BD_USUARIOS`
- Professor (além do comum): `11_AVALIACAO`, `12_PRESENCA` liberados; financeiro/estoque/config bloqueados

---

## 5. Fluxo de autenticação e sessão

```
00_LOGIN (botão Entrar)
    → modLogin.AbrirLogin
    → frmLogin
         → validar campos
         → buscar BD_USUARIOS (Usuario + Senha)
         → Status = Ativo?
         → modSessao.GravarSessao
         → modLog.RegistrarAcao "Login","Sistema"
         → modPermissoes.AplicarMenus
         → 01_DASHBOARD
```

### `BD_SESSAO` (aba VeryHidden)

| Célula | Campo |
|--------|-------|
| B1 | UsuarioLogado |
| B2 | NomeUsuario |
| B3 | PerfilUsuario |
| B4 | DataLogin |

Logout: limpa sessão, registra LOG, volta a `00_LOGIN`.

**Senhas:** texto simples na Fase 3. Hash em versão posterior.

---

## 6. Fluxo de auditoria (`LOG`)

Colunas: `Data | Hora | Usuario | Perfil | Acao | Modulo`

Ações mínimas: Login, Logout, Acesso negado, ALUNO_NEW, ALUNO_EDIT, ALUNO_DEL, PDF, etc.

API: `RegistrarAcao(acao As String, modulo As String)`

---

## 7. Padrão de tratamento de erros

1. `On Error GoTo Falha` em rotinas públicas.
2. Mensagens via `modUtil.MsgErro` / `MsgAviso` / `MsgOk`.
3. Falhas relevantes → `RegistrarAcao "Erro: …", modulo`.
4. Nunca engolir erro de permissão: sempre MsgBox + LOG + Exit.

---

## 8. Roadmap

1. **Fase 3 (atual):** login real, sessão, LOG, permissões, `frmLogin`.
2. **Fase 4:** renomear abas `BD_*`, criar `FORM_FINANCEIRO` / `FORM_ESTOQUE` / `FORM_PROFESSOR`.
3. **Fase 5:** extrair `modAluno`, `modFinanceiro`, `modRelatorios`.
4. **Fase 6:** hash de senha; gestão de usuários na UI (Admin).

---

## 9. Credenciais demo (Fase 3)

| Usuario | Senha | Perfil |
|---------|-------|--------|
| admin | 123456 | Administrador |
| financeiro | 123456 | Financeiro |
| recepcao | 123456 | Recepção |
| professor | 123456 | Professor |

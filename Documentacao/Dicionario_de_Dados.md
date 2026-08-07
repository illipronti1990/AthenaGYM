# Dicionário de Dados — Movvo Platform

**Versão:** 5.0.0 · **Épico 3 — Franquias A+B**  
**Modelo:** Opção 2 — banco único com `EmpresaID` + `UnidadeID` + camada de franquia  
**Regra de isolamento:** filtra `EmpresaID = Sessao.EmpresaID`; se `UnidadeIDSessao > 0`, também `UnidadeID = Sessao.UnidadeID`. Franqueadora vê a rede (`FranqueadoraID`); Franqueado vê sua empresa (`FranqueadoID`).

Legenda de status: **Aplicado** = coluna/migração nesta entrega · **Planejado** = documentado para Épico 1.1

---

## 1. Tenant / Plataforma

### BD_EMPRESAS · `tbEmpresas` · Status: Aplicado

| Campo | Tipo | Obrig. | PK/FK | Notas |
|-------|------|--------|-------|-------|
| EmpresaID | INT | Sim | PK | 0 = plataforma; 1+ = academias |
| Razão Social | VARCHAR(200) | Sim | | |
| Nome Fantasia | VARCHAR(150) | Sim | | |
| CNPJ | VARCHAR(18) | Sim | | |
| Inscrição Estadual | VARCHAR(30) | Não | | |
| Telefone | VARCHAR(20) | Não | | |
| WhatsApp | VARCHAR(20) | Não | | |
| Email | VARCHAR(120) | Não | | |
| Site | VARCHAR(150) | Não | | |
| CEP | VARCHAR(10) | Não | | |
| Endereço | VARCHAR(250) | Não | | |
| Número | VARCHAR(10) | Não | | |
| Complemento | VARCHAR(100) | Não | | |
| Bairro | VARCHAR(80) | Não | | |
| Cidade | VARCHAR(80) | Não | | |
| Estado | CHAR(2) | Não | | |
| País | VARCHAR(50) | Não | | default Brasil |
| Logo | VARCHAR(255) | Não | | path/URL |
| Cor Primária | VARCHAR(10) | Não | | hex |
| Cor Secundária | VARCHAR(10) | Não | | hex |
| Plano | VARCHAR(20) | Sim | | Basic / Pro / Enterprise |
| Status | VARCHAR(20) | Sim | | Ativo / Suspenso |
| Data Cadastro | DATETIME | Sim | | |
| Data Expiração | DATETIME | Não | | |

### BD_LICENCAS · `tbLicencas` · Status: Aplicado

| Campo | Tipo | Obrig. | PK/FK |
|-------|------|--------|-------|
| ID | INT | Sim | PK |
| EmpresaID | INT | Sim | FK → BD_EMPRESAS |
| Chave | VARCHAR(64) | Sim | | |
| Plano | VARCHAR(20) | Sim | | |
| Ativação | DATE | Sim | | |
| Expiração | DATE | Sim | | |
| Status | VARCHAR(20) | Sim | Ativa / Expirada / Suspensa |

### BD_CONFIG_EMPRESA · `tbConfigEmpresa` · Status: Aplicado

| Campo | Tipo | Obrig. | PK/FK |
|-------|------|--------|-------|
| ID | INT | Sim | PK |
| EmpresaID | INT | Sim | FK |
| Chave | VARCHAR(80) | Sim | | |
| Valor | VARCHAR(255) | Sim | | |

Sobrescreve/complementa `BD_PARAMETROS` global por tenant.

### BD_USUARIOS · `tbUsuarios` · Status: Aplicado (+ EmpresaID)

| Campo | Tipo | Obrig. | PK/FK |
|-------|------|--------|-------|
| ID | INT | Sim | PK |
| EmpresaID | INT | Sim | FK (0 = SuperAdmin plataforma) |
| Nome | VARCHAR(150) | Sim | | |
| Usuário | VARCHAR(60) | Sim | | |
| Senha | VARCHAR(255) | Sim | Excel plain demo; SQL = hash |
| Perfil | VARCHAR(40) | Sim | SuperAdmin / Administrador / … |
| Status | VARCHAR(20) | Sim | | |
| Token | VARCHAR(120) | Não | portal |
| Matrícula | VARCHAR(40) | Não | perfil Aluno |
| Último Acesso | DATETIME | Não | Planejado UI |

### BD_SESSAO · espelho · Status: Aplicado

Chaves: UsuarioLogado, NomeUsuario, PerfilUsuario, DataLogin, **EmpresaID**, **NomeEmpresa**, **PlanoEmpresa**

---

## 2. Núcleo com EmpresaID + UnidadeID (Épico 2)

| Tabela | ListObject | EmpresaID | UnidadeID |
|--------|------------|-----------|-----------|
| BD_ALUNOS | tbAlunos | Aplicado | Aplicado |
| BD_USUARIOS | tbUsuarios | Aplicado | Aplicado |
| BD_CONTAS_RECEBER | tbContasReceberBD | Aplicado | Aplicado |
| BD_CONTAS_PAGAR | tbContasPagarBD | Aplicado | Aplicado |
| BD_LANCAMENTOS | tbLancamentos | Aplicado | Aplicado |
| BD_PRODUTOS / MOV / VENDAS / COMPRAS | (estoque) | — | Aplicado |
| BD_UNIDADES | tbUnidades | Aplicado | — (catálogo) |
| BD_PARAMETROS_UNIDADE | tbParametrosUnidade | — | Aplicado |

Isolamento VBA: `PertenceEmpresa`, `PertenceUnidade`, `AdicionarRegistroUnidade`, `UnidadeIDSessao()`, `PodeVerUnidade`.

### Tabelas multiunidade C/D (Aplicado)

| Tabela | ListObject | Uso |
|--------|------------|-----|
| BD_PROFESSOR_UNIDADE | tbProfessorUnidade | Professor atende N unidades |
| BD_TRANSFERENCIAS | tbTransferencias | Estoque origem → destino |
| BD_USUARIO_UNIDADE | tbUsuarioUnidade | Permissão extra de unidade |
| BD_LEADS / BD_EVENTOS | + UnidadeID | CRM e Agenda filtrados |

### Épico 3 — Franquias (Aplicado A+B)

| Tabela | ListObject | Notas |
|--------|------------|-------|
| BD_FRANQUEADORAS | tbFranqueadoras | Rede / holding franchise |
| BD_FRANQUEADOS | tbFranqueados | Liga FranqueadoraID + EmpresaID |
| BD_CONTRATOS_FRANQUIA | tbContratosFranquia | Royalty % + fundo marketing % |
| BD_ROYALTIES | tbRoyalties | Competência, valor royalty + marketing |
| BD_EMPRESAS | + FranqueadoraID, FranqueadoID | Lookup rápido |
| 41_FRANQUEADORA | UI | KPIs + ranking + cadastro |

Macros: `CadastrarFranqueado`, `CalcularRoyalties`, `AtualizarDashboardFranqueadora`, `GerarRelatorioFranqueadora`.

---

## 3. Tabelas Planejado (Épico 2.1 — UnidadeID restante)

CRM restante: BD_CRM_HISTORICO, BD_RETENCAO, BD_CAMPANHAS, BD_INDICACOES  
Treinos: BD_AVALIACOES, BD_MEDIDAS, BD_TREINOS, BD_EXERCICIOS, BD_TREINO_ITENS, BD_FOTOS  
Acesso: BD_ACESSOS, BD_PRESENCAS  
BI / Portal / Athena: demais tabelas de suporte  

Mestras globais: BD_PARAMETROS, BD_PLANOS, BD_FORMAS_PAGAMENTO, BD_STATUS, BD_PERMISSOES, BD_CORES, VERSAO, LOG.

---

## 4. Planos SaaS

| Plano | Módulos |
|-------|---------|
| Basic | Alunos, Mensalidades, Financeiro, Agenda |
| Pro | + CRM, Dashboards, PDV/Estoque |
| Enterprise | + API, Athena AI, Portal/App, Multiunidade, Franquias |

---

## 5. Cloud SQL (espelho)

| Model | empresa_id | Status |
|-------|------------|--------|
| Empresa | PK | Aplicado |
| Licenca | FK | Aplicado |
| ConfigEmpresa | FK | Aplicado |
| Usuario | FK | Aplicado |
| Aluno | FK | Aplicado |
| Unidade | FK | Aplicado |
| ContaReceber | FK | Aplicado |
| demais | — | Planejado 1.1 |

Contrato login: `token`, `perfil`, `nome`, `matricula`, `empresa_id`, `plano`.

---

## 6. Relacionamentos

```
BD_EMPRESAS 1──* BD_USUARIOS
BD_EMPRESAS 1──* BD_LICENCAS
BD_EMPRESAS 1──* BD_CONFIG_EMPRESA
BD_EMPRESAS 1──* BD_UNIDADES
BD_EMPRESAS 1──* BD_ALUNOS
BD_ALUNOS 1──* BD_CONTAS_RECEBER
```

---

## 7. Regras de negócio

1. Login resolve usuário → EmpresaID → licença válida → sessão.
2. SuperAdmin (EmpresaID=0) acessa Master e todas as academias; não mistura dados em listagens de academia sem TrocarEmpresa.
3. `CriarAcademiaCompleta` cria empresa, licença, admin, configs padrão.
4. Nunca retornar registro com EmpresaID diferente da sessão (exceto SuperAdmin em modo Master).

# ATHENA GYM Cloud

Arquitetura alvo (Sprint 12 — SQL Foundation):

```
Excel VBA (equipe interna)
        │  Sincronizar → Sync/portal_export.json
        ▼
   FastAPI (contrato)
        │
        ▼
   SQL (fonte da verdade)
   ├── SQLite (dev local)
   └── PostgreSQL (produção)
        │
   ┌────┴────┐
   ▼         ▼
Portal Web  Flutter
```

## Pacote Supabase (`supabase-py`)

A API usa o client oficial:

```bash
cd cloud/api
python -m pip install -r requirements.txt
```

No `.env` (não no `.env.example`):

```env
SUPABASE_URL=https://SEU_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...   # service role / secret — só no servidor
```

Endpoints:

- `GET /supabase/status` — client configurado + ping
- `GET /supabase/empresas` — lê tabela via PostgREST (login admin/super)

SQLAlchemy (`DATABASE_URL`) continua opcional para migrations/seed locais.
Para produção SaaS, o caminho preferido de leitura/escrita cloud é o **pacote Supabase**.

## Multi-tenant (Épico 1)

- Login retorna `empresa_id`, `plano`, `nome_empresa`
- SuperAdmin: usuário `super` / `123456` (empresa_id=0)
- Academia demo: `admin` / `123456` (empresa_id=1, Enterprise)
- Após mudar schema: apague `cloud/api/data/athena.db` (ou use `athena_mt.db`) e reinicie a API para recriar o banco multi-tenant.

## 1) API com SQL (SQLite — zero instalação)

```bash
cd cloud/api
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

- Health: http://127.0.0.1:8000/health  
- Docs: http://127.0.0.1:8000/docs  
- Banco criado em: `cloud/api/data/athena.db`

## 2) Portal Web

```bash
cd cloud/portal-web
python -m http.server 5173
```

http://127.0.0.1:5173 — login `aluno` / `123456`

## 3) Sync Excel → SQL

1. No Excel: menu **☁ Sync** (ou Portal → **Sincronizar**)
2. Gera `Sync/portal_export.json`
3. Com token admin:

```bash
# login
curl -s -X POST http://127.0.0.1:8000/auth/login -H "Content-Type: application/json" -d "{\"usuario\":\"admin\",\"senha\":\"123456\"}"

# import (cole o token)
curl -s -X POST http://127.0.0.1:8000/sync/import -H "Authorization: Bearer SEU_TOKEN"
```

Ou status: `GET /sync/status`

## 4) PostgreSQL (opcional)

```bash
cd cloud
docker compose up -d
```

No Windows (PowerShell):

```powershell
$env:DATABASE_URL="postgresql+psycopg://athena:athena@localhost:5432/athena"
cd api
python -m uvicorn app.main:app --reload --port 8000
```

## Usuários demo (seed SQL)

| Usuário | Senha | Perfil |
|---------|-------|--------|
| aluno | 123456 | Aluno |
| professor | 123456 | Professor |
| recepcao | 123456 | Recepção |
| admin | 123456 | Administrador |
| financeiro | 123456 | Financeiro |

## Próximos passos

- Expandir sync (treinos, financeiro, acessos) além de alunos
- React no `portal-web`
- Flutter consumindo os mesmos endpoints
- Hash/roles já no SQL; migrar senhas do Excel para hash no sync

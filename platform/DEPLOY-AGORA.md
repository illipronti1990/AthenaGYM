# Deploy agora — Movvo ERP em produção

**Status (2026-08-07): produção no ar.**

| App | URL | Status |
|-----|-----|--------|
| Site | https://movvoerp.com.br | 200 |
| WWW | https://www.movvoerp.com.br | 200 |
| API | https://api.movvoerp.com.br | health/branding/features 200 |

Projetos: `athena-gym` (web) · `athena-api` (API)  
Repo: https://github.com/illipronti1990/AthenaGYM

---

## Já configurado

- Vercel envs: `NEXT_PUBLIC_API_URL`, CORS apex+www, `PASSWORD_RESET_REDIRECT`, `DEV_AUTH=false`
- Supabase Auth: Site URL `https://movvoerp.com.br` + redirect allow list (apex/www/legado/localhost)
- Assets `/brand/*` e Brand API Movvo

Regenerar envs locais (gitignored):

```bash
cd platform
node scripts/prepare-prod-env.mjs https://api.movvoerp.com.br https://movvoerp.com.br
```

---

## Contas demo (tenant Athena Academia)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin.demo@movvoerp.com.br` | `Demo@123456` |
| Aluno | `aluno.demo@movvoerp.com.br` | `Demo@123456` |
| Professor | `professor.demo@movvoerp.com.br` | `Demo@123456` |

Seed idempotente: `cd platform/apps/api && ENV_FILE=.env.production.local node scripts/seed-demo-users.mjs`

> Em **dev local** (DEV_AUTH=true) ainda valem: `teste@athena.local`, `renan.aluno@athena.local`, `bruna.professora@athena.local` / `teste123`.

## Landing M-2

Site comercial em `/` (route group marketing). Docs: [`../Documentacao/MOVVO_LANDING_M2.md`](../Documentacao/MOVVO_LANDING_M2.md)

## Smoke manual restante

1. Abrir https://movvoerp.com.br/ (landing) e https://movvoerp.com.br/login
2. Login com usuário real Supabase
3. Confirmar footer `v0.7.0-beta · Build 2026.08`
4. Enviar formulário de demonstração em `/#contato`

Guia completo: [DEPLOY.md](./DEPLOY.md)

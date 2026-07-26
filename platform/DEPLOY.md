# Deploy ATHENA PLATFORM (gratuito)

Stack alvo:

| Serviço | Host | Plano |
|---------|------|--------|
| Front (Next.js) | [Vercel](https://vercel.com) | Free |
| API (NestJS) | [Render](https://render.com) | Free |
| Banco / Auth / Storage | [Supabase](https://supabase.com) | Free (já em uso) |

Repositório: `https://github.com/illipronti1990/AthenaGYM.git`  
Pasta do monorepo: `platform/`

---

## 0. Antes de tudo

1. Faça commit e push das alterações de deploy para o GitHub.
2. Em **produção**, login DEV fica desligado (`DEV_AUTH_ENABLED=false` e `NEXT_PUBLIC_DEV_AUTH=false`).
3. Tenha em mãos (Supabase → Project Settings → API):
   - Project URL
   - `anon` / public key
   - `service_role` key (só na API — nunca no front)
   - JWT Secret (Settings → API → JWT Settings)

---

## 1. API no Render

1. Acesse [https://dashboard.render.com](https://dashboard.render.com) e conecte o GitHub.
2. **New → Blueprint** (ou Web Service) apontando para o repo `AthenaGYM`.
3. Se usar Blueprint: o arquivo é `platform/render.yaml`.
4. Se criar Web Service manual:
   - **Root Directory:** `platform`
   - **Runtime:** Docker
   - **Dockerfile Path:** `./apps/api/Dockerfile`
   - **Docker Context:** `.` (a pasta `platform`)
   - **Health Check Path:** `/api/v1/health`
5. Variáveis de ambiente (Environment):

| Key | Valor |
|-----|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | `3001` |
| `DEV_AUTH_ENABLED` | `false` |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `SUPABASE_JWT_SECRET` | JWT secret |
| `CORS_ORIGINS` | `https://SEU-APP.vercel.app` (atualize depois do passo 2) |
| `PASSWORD_RESET_REDIRECT` | `https://SEU-APP.vercel.app/login` |
| `QR_SIGNING_SECRET` | string aleatória forte |
| `FINANCE_WEBHOOK_SECRET` | string aleatória |

6. Deploy → anote a URL da API, ex.: `https://athena-api.onrender.com`
7. Teste: `https://athena-api.onrender.com/api/v1/health`

> Free do Render pode “dormir”. A primeira requisição após idle pode demorar ~30–60s.

---

## 2. Front no Vercel

1. Acesse [https://vercel.com/new](https://vercel.com/new) e importe `AthenaGYM`.
2. Configure:
   - **Root Directory:** `platform/apps/web`
   - Framework: Next.js (detectado)
   - Install/Build: já definidos em `platform/apps/web/vercel.json`
3. Environment Variables:

| Key | Valor |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `NEXT_PUBLIC_API_URL` | `https://athena-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_DEV_AUTH` | `false` |
| `NEXT_PUBLIC_GYM_INSTAGRAM` | `https://www.instagram.com/athenagym.oficial/` |
| `NEXT_PUBLIC_GYM_WHATSAPP` | número com DDI, ex. `5511...` |

4. Deploy → anote a URL, ex.: `https://athena-gym.vercel.app`
5. Volte no **Render** e atualize:
   - `CORS_ORIGINS=https://athena-gym.vercel.app`
   - `PASSWORD_RESET_REDIRECT=https://athena-gym.vercel.app/login`
6. Redeploy da API no Render.

---

## 3. Supabase (URLs de auth)

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** `https://athena-gym.vercel.app`
3. **Redirect URLs** (adicione):
   - `https://athena-gym.vercel.app/**`
   - `https://athena-gym.vercel.app/login`
   - `http://localhost:3000/**` (manter para dev local)

---

## 4. Checklist pós-deploy

- [ ] `GET /api/v1/health` responde `ok`
- [ ] Site abre no Vercel
- [ ] Login com usuário real do Supabase (não o login DEV)
- [ ] Dashboard carrega dados
- [ ] Ícones WhatsApp / Instagram abrem
- [ ] CORS sem erro no DevTools (aba Network)

---

## 5. Build local (validar antes do push)

```bash
cd platform
pnpm install
pnpm build:packages
pnpm build:api:prod
pnpm build:web:prod
```

Docker da API (opcional):

```bash
cd platform
docker build -f apps/api/Dockerfile -t athena-api .
docker run --rm -p 3001:3001 --env-file apps/api/.env athena-api
```

---

## 6. Domínio próprio (opcional)

- Vercel → Project → Settings → Domains → adicionar `app.suadominio.com`
- Atualizar `CORS_ORIGINS`, `PASSWORD_RESET_REDIRECT` e Site URL do Supabase

---

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| API 502 / sleep | Aguarde 1 min e recarregue (plano Free) |
| CORS blocked | `CORS_ORIGINS` deve ser exatamente a URL do Vercel (sem `/` no fim) |
| Login falha | `NEXT_PUBLIC_DEV_AUTH=false` + redirect URLs no Supabase |
| Build Vercel falha em `@athena/shared` | Confirme Root Directory = `platform/apps/web` e `vercel.json` |
| Build Docker falha | Contexto = pasta `platform`, não a raiz do Git |

Worker/Redis não são obrigatórios para o app web + API core. Pode ficar para uma segunda etapa.

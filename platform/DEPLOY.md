# Deploy Movvo ERP — produção

> **G-20:** packages são `@movvo/*`. Slugs Vercel/Render `athena-gym` / `athena-api` permanecem como **exceção de infra** (DNS já bound a movvoerp.com.br) — não renomear sem checklist operacional.

**Domínios oficiais (Vercel):**

| Serviço | Domínio | Projeto Vercel |
|---------|---------|----------------|
| Front (Next.js) | https://movvoerp.com.br · https://www.movvoerp.com.br | `athena-gym` |
| API (NestJS) | https://api.movvoerp.com.br | `athena-api` |
| Banco / Auth | Supabase | projeto existente |

Fallback legado (ainda válido enquanto DNS propaga): `https://athena-gym.vercel.app` · `https://athena-api-seven.vercel.app`

Repositório: `https://github.com/illipronti1990/AthenaGYM.git` · pasta `platform/`

---

## DNS

**Status (2026-08-07):** apex, `www` e `api` respondem em HTTPS (200). Domínios ativos na Vercel.

Se o DNS cair no futuro, no registrador:

**A) Nameservers Vercel** — `ns1.vercel-dns.com` / `ns2.vercel-dns.com`  
**B) Registros** — Apex `A` → `76.76.21.21` · `www`/`api` CNAME → Vercel

Painel: https://vercel.com/illipronti1990s-projects/athena-gym/settings/domains

---

## Variáveis de produção (canônicas)

### Front (`athena-gym`)

| Key | Valor |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `NEXT_PUBLIC_API_URL` | `https://api.movvoerp.com.br/api/v1` |
| `NEXT_PUBLIC_DEV_AUTH` | `false` |
| `NEXT_PUBLIC_GYM_INSTAGRAM` | Instagram da academia (tenant) |
| `NEXT_PUBLIC_GYM_WHATSAPP` | número com DDI |

### API (`athena-api`)

| Key | Valor |
|-----|--------|
| `NODE_ENV` | `production` |
| `DEV_AUTH_ENABLED` | `false` |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET` | Supabase |
| `CORS_ORIGINS` | `https://movvoerp.com.br,https://www.movvoerp.com.br,https://athena-gym.vercel.app` |
| `PASSWORD_RESET_REDIRECT` | `https://movvoerp.com.br/login` |
| `QR_SIGNING_SECRET` / `FINANCE_WEBHOOK_SECRET` | secrets fortes |
| `REDIS_URL` | Redis obrigatório em staging/prod (Upstash ou gerenciado); mesmo URL para API cache + worker BullMQ |
| `WORKER_HEALTH_URL` | URL do health do worker (ex. `https://worker.example.com/health`) — usado em `/health` e `/health/queues` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | opcional; ex. `http://otel-collector:4318` |
| `OTEL_SERVICE_NAME` | `movvo-api` (worker: `movvo-worker`) |
| `SENTRY_DSN` | opcional; só inicializa se setado |
| `LOG_LEVEL` | Pino (`info` default) |
| `SECRETS_ENCRYPTION_KEY` | G-16 AES-GCM (prod) |

### Worker (Render / Fly — long-running, **não** Vercel serverless)

| Key | Valor |
|-----|--------|
| `REDIS_URL` | mesmo da API |
| `SUPABASE_*` | service role para processadores |
| `PORT` | health HTTP do worker (ex. 3011) |
| `OTEL_*` / `SENTRY_DSN` | opcional |

Deploy: serviço separado com process sempre-on; API serverless apenas **produz** jobs e lê cache. Ver `Documentacao/MOVVO_SCALE_G17.md` (RPO/RTO filas/cache + runbooks flush Redis / redrive DLQ).

Health: `https://api.movvoerp.com.br/api/v1/health` · cache `.../health/cache` · métricas `.../metrics`

### Supabase Auth → URL Configuration

**Status:** configurado no projeto `jvwcgjfszpzifyfbwtqf`.

- **Site URL:** `https://movvoerp.com.br`
- **Redirect URLs:**
  - `https://movvoerp.com.br/**` · `/login`
  - `https://www.movvoerp.com.br/**` · `/login`
  - `https://athena-gym.vercel.app/**` · `/login` (legado)
  - `http://localhost:3000/**` · `/login` (dev)

Script: `node scripts/configure-prod-supabase-auth.mjs` (requer `SUPABASE_ACCESS_TOKEN`).

---

## Deploy / redeploy

```bash
cd platform
# regenera .env.production.local (gitignored)
node scripts/prepare-prod-env.mjs https://api.movvoerp.com.br https://movvoerp.com.br

# deploy (projetos já linkados na Vercel via Git)
git push origin HEAD
```

Ou pelo CLI:

```bash
# Web (platform/vercel.json espelha apps/web/public → public/)
npx vercel --prod --yes --project athena-gym

# API (usar pasta .deploy-api com packages vendored)
cd .deploy-api && npx vercel --prod --yes
```

Health: `https://api.movvoerp.com.br/api/v1/health`  
Brand API: `https://api.movvoerp.com.br/api/v1/branding`  
Site: `https://movvoerp.com.br`  
Fallback: `https://athena-gym.vercel.app` · `https://athena-api-seven.vercel.app`

---

## Checklist produção (status real — 2026-08-07)

- [x] `https://movvoerp.com.br/login` → 200
- [x] `https://www.movvoerp.com.br/login` → 200
- [x] `https://api.movvoerp.com.br/api/v1/health` → 200
- [x] `GET /api/v1/branding` → 200 (Movvo ERP)
- [x] `GET /api/v1/platform/features` → 200
- [x] Assets `/brand/logo.svg` · `/brand/movvo-ai.svg` → 200
- [x] CORS apex + www → `Access-Control-Allow-Origin` ok
- [x] Supabase Site URL + Redirect URLs produção
- [x] `DEV_AUTH` / `NEXT_PUBLIC_DEV_AUTH` = false
- [x] Landing M-2 em `/` (marketing) — ver `Documentacao/MOVVO_LANDING_M2.md`
- [x] Redis Upstash (`movvo-redis`) ligado a `athena-api` + `athena-gym` — `/health/cache` → ok
- [ ] Worker BullMQ no Render (`movvo-worker`) + `WORKER_HEALTH_URL` na API
- [ ] Login real com usuário Supabase (smoke manual no browser)
- [ ] Footer: `v0.7.0-beta · Build 2026.08` (conferir no login)
- [ ] Formulário demo → `POST /marketing/demo-requests` (após redeploy API)

### Worker no Render (1×)

1. https://dashboard.render.com/select-repo?type=blueprint → repo `AthenaGYM` → blueprint `render.yaml`
2. Envs: `REDIS_URL` (copiar de Vercel → athena-api → `REDIS_URL`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
3. Após deploy: `https://movvo-worker.onrender.com/health`
4. Na Vercel `athena-api`: `WORKER_HEALTH_URL=https://movvo-worker.onrender.com/health` → redeploy API


---

## Build local (antes do push)

```bash
cd platform
pnpm install
pnpm build:packages
pnpm build:api:prod
pnpm build:web:prod
```

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| Domínio não resolve | Nameservers / A record ainda no registrador |
| CORS blocked | `CORS_ORIGINS` com apex + www (sem `/` final) |
| Login falha | Site URL + Redirect URLs no Supabase |
| Branding 404 na API | Redeploy `athena-api` com código M-1+ |
| API sleep / frio | Aguarde 30–60s na 1ª request (plano Free) |

Brand book: [`Documentacao/MOVVO_BRAND_BOOK.md`](../Documentacao/MOVVO_BRAND_BOOK.md)

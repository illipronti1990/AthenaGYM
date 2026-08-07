# Movvo G-17 — Performance, Escala e Observabilidade

## Resumo

Sprint de escala multi-tenant: cache Redis na API, filas BullMQ no worker long-running, métricas Prometheus + RUM, FE lazy/virtualização, uploads por tenant (`StorageService`), índices SQL e painel DevOps em `/app/platform/observability`.

Produção: **Vercel** (web + API serverless) + **worker dedicado** (Render/Fly) + Redis compartilhado + Supabase.

## Migration

`platform/supabase/migrations/20260811_0001_scale_g17.sql`

- Índices compostos (audit, check-ins, receivables, outbox pending)
- Função `claim_outbox_batch` (`FOR UPDATE SKIP LOCKED`)

## Cache Redis

Chave: `movvo:{env}:{companyId|global}:{domain}:{key}`

TTLs alinhados ao React Query (`queryKeys.ts`). Invalidação explícita em writes (settings, branding, plans, flags, permissions).

Graceful degrade se `REDIS_URL` ausente ou Redis down (API continua sem cache).

Health: `GET /api/v1/health/cache` (PING + stats hits/misses/hitRate).

### Runbook — flush Redis

1. Confirmar impacto: dashboard/settings voltarão a bater no Postgres até rebuild.
2. Staging: `redis-cli -u $REDIS_URL FLUSHDB` (nunca `FLUSHALL` em Redis compartilhado sem checklist).
3. Alternativa segura: invalidar prefixo `movvo:{env}:{companyId}:*` via API/ops script.
4. Validar `GET /health/cache` e hit rate em `/metrics` após tráfego.

**RPO cache:** 0 (cache é efêmero). **RTO cache:** ≤ 5 min (reconnect + warm natural).

## Filas (BullMQ)

API produz jobs; worker long-running consome (`emails`, `exports`, `reports`, `webhooks`, `ai`, …).

Health worker: `WORKER_HEALTH_URL` → incluído em `GET /health` e `GET /health/queues`.

### Runbook — redrive DLQ / failed

1. Abrir Bull Board / Redis keys `bull:{queue}:failed` (ou painel do provedor).
2. Inspecionar payload + stack; corrigir causa (credencial, timeout, schema).
3. Redrive: `job.retry()` / move failed → wait; ou re-enfileirar via API producer.
4. Confirmar `completed` sobe e `failed` estabiliza; alertar se lag > limiar.

**RPO filas:** jobs em Redis — perda só se Redis sem AOF/RDB; alvo operacional ≤ 15 min com persistência Redis.  
**RTO filas:** ≤ 30 min (redeploy worker + redrive).

## SLA (metas G-17)

| Caminho | Meta |
|---------|------|
| API hot path (cache hit) p95 | &lt; 500 ms |
| Check-in p95 | &lt; 800 ms |
| FE FCP / LCP / INP | ver `scripts/lighthouse-g17.mjs` |

Carga: `platform/tests/load/` (k6 smoke 50 VU, login+dashboard 500 VU, check-in burst).

## Observabilidade

| Endpoint | Auth | Uso |
|----------|------|-----|
| `GET /api/v1/metrics` | público (rede interna) | Prometheus |
| `POST /api/v1/observability/rum` | público amostrado | RUM web |
| `GET /api/v1/observability/status` | JWT + `observability.read` \| `platform.manage` \| `saas.read` | Painel DevOps |
| `GET /api/v1/health` (+ `/cache`, `/queues`) | público | Uptime |

UI: `/app/platform/observability`  
Grafana: `platform/infrastructure/monitoring/grafana/dashboards/movvo-g17-api.json`

## Storage (CDN paths)

`StorageService` padroniza:

```
companies/{companyId}/{alunos|professores|produtos|documentos|patrimonio|branding|...}/v{timestamp}/{filename}
```

- Signed upload/download via Supabase Storage
- `cacheControl` público quando aplicável (`public, max-age=86400`)
- Next `images.remotePatterns`: `*.supabase.co`

Não reescrever todos os call sites nesta sprint — novos uploads devem usar `StorageService.path()`.

## Arquitetura (resumo)

```
Web (Vercel) → API Nest (Vercel serverless) → Redis (cache + BullMQ producers)
                                         ↘ Supabase
Worker (Render/Fly long-running) ← Redis queues → Supabase
API/Worker → OTel → Prometheus → Grafana
Web RUM → POST /observability/rum
```

API permanece **stateless** (JWT + `user_sessions`); Redis é estado compartilhado de cache/filas.

## RLS / hot paths

- Listagens quentes usam índices compostos + `company_id` no filtro (alinha com policies tenant).
- Preferir `eq/in` em colunas indexadas; evitar `OR` amplo e `ilike '%x%'` sem limite de página.
- Policies que forçam seq scan: revisar `EXPLAIN` em students/receivables/audit após migration G-17.
- Cliente Supabase HTTP permanece (sem `pg.Pool`); paginação max 200 via `paginate()`.

## Variáveis

Ver `platform/DEPLOY.md`: `REDIS_URL`, `WORKER_HEALTH_URL`, `OTEL_*`, `SENTRY_DSN`, `LOG_LEVEL`.

## QA

- Playwright: `platform/tests/scale.g17.smoke.spec.ts`
- Unit: `apps/api/src/cache/redis-cache.key.spec.ts`
- Lighthouse: `apps/web/scripts/lighthouse-g17.mjs`

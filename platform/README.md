# ATHENA PLATFORM — Sprint 8 (BI, Analytics e IA)

Produto oficial: **Next.js + NestJS + Supabase + Worker BullMQ/Redis**.  
Excel/VBA = import/export. FastAPI em `cloud/api` = **congelado**.

```
platform/
  apps/web                 /app/analytics/*
  apps/api                 AnalyticsModule
  apps/worker              analytics/predictions/warehouse/exports
  apps/ai-service          stub
  packages/sdk-bi          KPIs + churn/lead heuristics + CSV
  packages/shared
  supabase/migrations
  infrastructure/monitoring
  tests/
```

## Setup

```bash
cd platform
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d redis
```

## Deploy (internet)

Guia completo (Vercel + Render + Supabase Free): veja **[DEPLOY.md](./DEPLOY.md)**.

```bash
pnpm build:packages
pnpm build:api:prod
pnpm build:web:prod
```

### Migrations

1–9: core → engagement  
10. `20260723_0010_analytics.sql`

```bash
cd ../cloud/api
python -m scripts.apply_sql_supabase ../../platform/supabase/migrations/20260723_0010_analytics.sql
```

### Observabilidade

```bash
cd infrastructure/monitoring
docker compose up -d
```

## Analytics API

| Área | Paths | Permissão |
|------|-------|-----------|
| Dashboard | `GET /analytics/dashboard`, `GET /analytics/kpis` | analytics.read |
| Executivo | `GET /executive` | executive.read |
| Churn / Predições | `GET /analytics/churn`, `GET/POST /analytics/predictions` | predictions.* |
| Warehouse | `POST /analytics/warehouse/sync` | analytics.manage |
| Reports | `GET/POST /reports`, `GET /reports/:id`, schedules | reports.* |
| Exports | `GET/POST /exports` | reports.export |
| IA BI | `POST /ai/insights` | ai.insights |

Web: `/app/analytics` (+ executive, reports, predictions, ai).

Worker: `analytics`, `predictions`, `warehouse`, `exports` (+ `reports` existente).

## Data Warehouse

Schema `analytics`: `fact_checkins`, `fact_revenue`, `fact_workouts`, `fact_sales`.  
ETL leve via worker outbox `analytics.warehouse.*` (CDC completo = evolução).

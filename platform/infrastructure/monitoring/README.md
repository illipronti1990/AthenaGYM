# Observability — Sprint 8 + G-17

Scaffold for OpenTelemetry → Prometheus / Grafana / Loki / Alertmanager.

## Stack (docker compose)

```bash
cd platform/infrastructure/monitoring
docker compose up -d
```

| Service | Port | Role |
|---------|------|------|
| Prometheus | 9090 | Metrics scrape |
| Grafana | 3002 | Dashboards (admin / `movvo`) |
| Loki | 3100 | Logs |
| Alertmanager | 9093 | Alerts |
| OTel Collector | 4317/4318 | Traces/metrics OTLP |

## Provisioned dashboard (G-17)

- JSON: `grafana/dashboards/movvo-g17-api.json`
- Datasource: Prometheus (`uid: prometheus`)
- Panels: API latency (`movvo_http_latency_avg_ms`), errors (`movvo_http_errors_total`), cache hit (`movvo_cache_hit_rate`), queue depth (`movvo_queue_waiting|active|failed`, labels `queue=` no worker)

Prometheus scrapes API at `http://host.docker.internal:3001/api/v1/metrics`.

## App instrumentation

- Nest: Pino + `GET /api/v1/metrics` (Prometheus text) + `POST /observability/rum` + `GET /observability/status`
- Worker: BullMQ health via `WORKER_HEALTH_URL`
- Web: RUM export from `PerformanceMonitor` → `/observability/rum`

Env hints:

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=movvo-api
REDIS_URL=redis://localhost:6379
SENTRY_DSN=
WORKER_HEALTH_URL=http://localhost:3011/health
```

## G-16 — Alertas mínimos (produção)

Probe HTTP a cada 1–5 min:

| Check | Expectativa |
|-------|-------------|
| `GET https://api.movvoerp.com.br/api/v1/health` | 200 e `status` ≠ `down` |
| `GET .../health/db` | 200 |
| `GET .../health/cache` | 200 (Redis) |
| `GET .../health/integrations` | 200 (ou 503 = alert warning) |

Runbooks: `Documentacao/MOVVO_SECURITY_G16.md` + `Documentacao/MOVVO_SCALE_G17.md`.
Desligar Auto-Deploy do Render legado `athena-api` para evitar falsos e-mails de falha.

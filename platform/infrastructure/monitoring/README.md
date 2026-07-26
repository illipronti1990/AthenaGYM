# Observability — Sprint 8

Scaffold for OpenTelemetry → Prometheus / Grafana / Loki / Alertmanager.

## Stack (docker compose)

```bash
cd platform/infrastructure/monitoring
docker compose up -d
```

| Service | Port | Role |
|---------|------|------|
| Prometheus | 9090 | Metrics scrape |
| Grafana | 3002 | Dashboards |
| Loki | 3100 | Logs |
| Alertmanager | 9093 | Alerts |
| OTel Collector | 4317/4318 | Traces/metrics OTLP |

## App instrumentation (next)

- Nest: `@opentelemetry/sdk-node` + Prometheus exporter on `/metrics`
- Worker: same SDK, queue lag gauges
- Web: optional RUM via OTel browser SDK

Env hints:

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=athena-api
```

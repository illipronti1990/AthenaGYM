# Infrastructure scaffold (Sprint 8+)

```
infrastructure/
  monitoring/   Prometheus, Grafana, Loki, Alertmanager, OTel
  docker/       (future) compose overlays
  k8s/          (future) manifests
  logging/      (future) log shipping
  terraform/    (future) cloud IaC
```

Prepares ATHENA for selective microservice scale-out (`analytics-service`, `integration-hub`, `realtime-gateway`).

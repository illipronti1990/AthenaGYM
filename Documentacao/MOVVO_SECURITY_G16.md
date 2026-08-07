# Movvo G-16 — Segurança, LGPD, Auditoria e Compliance

## Resumo

Sprint que endurece a plataforma para operação SaaS: auditoria confiável, MFA, sessões, LGPD, retenção, secrets criptografados, rate limit/lockout, health granular, backup/DR documentado e dashboard de segurança.

Produção oficial: **Vercel** (`api.movvoerp.com.br` / `movvoerp.com.br`). O serviço Render `athena-api` é legado — desligar Auto-Deploy no painel Render para evitar e-mails de falha.

## Migration

`platform/supabase/migrations/20260810_0001_security_g16.sql`

- Extensão `audit_logs`: `before_data`, `after_data`, `request_id`, `severity`
- `user_sessions`, `user_mfa`, `security_events`
- `consents`, `lgpd_requests`, `retention_policies`
- `integration_secrets` (AES-GCM), `backup_logs`, `api_rate_limits`
- Permissões: `security.read|write`, `lgpd.read|manage`

## API (`/api/v1/security/*`)

| Área | Endpoints |
|------|-----------|
| Dashboard | `GET /security/dashboard` |
| Sessões | `GET /security/sessions`, `DELETE /security/sessions/:id`, `POST /security/sessions/revoke-all` |
| MFA | `GET /security/mfa`, TOTP enroll/verify/disable, e-mail OTP send/verify |
| LGPD | consents, export, anonymize, erase, requests |
| Retenção | `GET/PUT /security/retention`, `POST /security/retention/purge` |
| Secrets | `GET/PUT /security/secrets` |
| Backups | `GET/POST /security/backups` |

Auth extras:

- `POST /auth/login-events` — rate limit 5/min + lockout após 5 falhas/15min (`security_events`)
- `POST /auth/logout` — auditoria
- `POST /auth/session` — registra sessão ativa

Health:

- `GET /health` (503 se critical down)
- `GET /health/db`
- `GET /health/cache`
- `GET /health/integrations`

## Web

Rotas `/app/security/{dashboard,sessions,audit,lgpd,retention}` (+ MFA na tela de sessões).

## Secrets / ambientes

| Variável | Uso |
|----------|-----|
| `SECRETS_ENCRYPTION_KEY` | AES-256-GCM para `integration_secrets` (obrigatório em prod) |
| `QR_SIGNING_SECRET` | fallback de chave se SECRETS não setada (dev only) |
| Vercel env | separar **development / homologation / production** nos projetos `athena-api` e `athena-gym` |

Rotação: `PUT /security/secrets` grava novo ciphertext e `rotated_at`.

Integrações alvo: Mercado Pago, Asaas, Wellhub, TotalPass (via `provider` + `key_name`).

## Backup & DR

| Item | Valor alvo |
|------|------------|
| RPO | ≤ 24h (export diário + PITR Supabase) |
| RTO | ≤ 4h (restore PITR + re-deploy Vercel) |
| App export | `POST /backup` (settings) + `backup_logs` |
| DB | Supabase Point-in-Time Recovery (plano Pro+) |

### Checklist restore (dry-run)

1. Confirmar último `backup_logs.status=success`
2. Em projeto staging: restore PITR Supabase até timestamp T
3. Reapontar `SUPABASE_*` staging e validar `/health` + login
4. Registrar `backup_type=restore_test` em `backup_logs`

### Alertas mínimos

- Probe `/api/v1/health` a cada 1–5 min (uptime / Alertmanager)
- Alertar se `status=down` ou `/health/db` 503
- Revisar `security_events` tipo `login.lockout` diariamente

## Job de retenção

```bash
PURGE_BEARER_TOKEN=<admin-jwt> node platform/scripts/purge-retention.mjs [companyId]
```

Defaults: logs 365d, audit 730d, backup 90d, security_events 365d.

## Testes

- Playwright: `platform/tests/security.g16.smoke.spec.ts`
- Manual: enroll MFA, revoke sessão, export LGPD, health 200

## Fora de escopo

SMS MFA, Vault externo, WAF comercial, restore PITR automático na UI.

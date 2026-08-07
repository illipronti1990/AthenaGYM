# Movvo — Plataforma SaaS, White Label e Billing (G-15)

Control plane multiempresa: tenants (`companies`), white label com domínio DNS/SSL, billing stub-ready, planos, feature flags, licenças, portal do cliente e endurecimento PaaS.

## Decisões

- Tenant = `companies` (sem tabela `tenants` paralela)
- Billing stub + contrato de gateway (Asaas/Stripe depois)
- Domínio próprio com verificação DNS TXT + SSL stub (`MOVVO_DNS_STUB=1` ou non-production)
- Tabelas `saas_*` separadas das assinaturas de alunos
- Operador: `/app/platform/*` · Portal academia: `/app/platform/portal`

## Migration

`platform/supabase/migrations/20260809_0001_saas_g15.sql`

## API

| Prefixo | Uso |
|---------|-----|
| `/api/v1/platform/tenants` | CRUD tenants, domains, entitlements, feature overrides |
| `/api/v1/saas-billing/*` | planos, trial, subscribe, upgrade/downgrade, renew, cancel, invoices, dashboard, reports, tickets |
| `/api/v1/platform/clients` | API keys + rotate/revoke |
| `/api/v1/platform/webhooks` | CRUD + deliveries/replay |
| `/api/v1/branding` | Resolve por `X-Company-Id` ou `Host` |
| `/api/v1/platform/features` | Flags env ∪ entitlements |

Permissões: `saas.read|manage|billing|reports` (super_admin).

## Web

`/app/platform/dashboard|tenants|plans|billing|licenses|feature-flags|portal|api-keys|webhooks|marketplace|environments|reports`

## SSL / DNS (produção)

1. Criar domínio → obter `verification_token`
2. Publicar TXT no DNS com o token
3. `POST .../domains/:id/verify`
4. Em produção, trocar o stub SSL por Cloudflare/Let’s Encrypt (interface no serviço; stub marca `ssl_status=provisioned`)

## Fora de escopo

Cobrança real · plugins runtime · multi-região · mobile WL · G-16 avançado

## QA

`platform/tests/saas.g15.smoke.spec.ts`

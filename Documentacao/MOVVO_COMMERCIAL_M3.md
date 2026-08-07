# Fase M-3 — Estrutura Comercial, Marketing e Sucesso do Cliente

## Entregue

### Planos + Demo
- Planos enriquecidos (`planCode`, limites, `billingReady`) em `/planos`
- Fluxo `/demonstracao` → `/demonstracao/obrigado`
- API `POST /marketing/demo-requests` com `state`, `whatsapp`, `primaryInterest`, `planInterest`
- Status CRM: `new` → `contacted` → `demo_scheduled` → `proposal_sent` → `negotiation` → `won`/`lost`
- E-mail Resend (opcional) + webhook + log

### Conteúdo público
- `/ajuda`, `/blog`, `/sobre`, `/status`, `/developers` (conteúdo versionado em `modules/marketing/content/`)
- Sitemap atualizado com rotas e seeds

### CRM + Analytics + Onboarding
- `/app/commercial` — lista/filtros/atualização de leads
- `/app/commercial/analytics` — funil e UTM
- `/app/commercial/onboarding` — checklist cadastro→go_live
- `/app/commercial/templates` — preview de templates de e-mail
- Guard: JWT + roles `super_admin` / `admin`

### Materiais
- `Documentacao/comercial/` (apresentação, one-pager, ficha técnica, features, comparativo)
- `GET /api/v1/marketing/materials/one-pager.pdf` (ops)
- `public/comercial/one-pager.md`

## Env

```
RESEND_API_KEY=
MARKETING_EMAIL_FROM=Movvo <noreply@movvoerp.com.br>
MARKETING_OPS_EMAIL=vendas@movvoerp.com.br
MARKETING_WEBHOOK_URL=
NEXT_PUBLIC_WHATSAPP_SALES=55...
```

## Migration

Aplicar `platform/supabase/migrations/20260807_0003_marketing_commercial_m3.sql` no projeto Supabase.

## QA checklist

- [ ] `/planos` exibe tabela completa e CTAs `?plan=`
- [ ] Demo com LGPD → obrigado com protocolo
- [ ] `/ajuda` e `/blog` com seeds
- [ ] `/status` consome health
- [ ] `/app/commercial` bloqueia não autenticado
- [ ] Admin lista/atualiza lead
- [ ] Analytics summary responde
- [ ] Onboarding cria etapa
- [ ] Playwright `commercial.m3.smoke.spec.ts`
- [ ] Sem cobrança recorrente real (fora de escopo)

## Fora de escopo

Gateway de pagamento, CMS headless, assinatura eletrônica, app mobile, rename `@movvo/*`.

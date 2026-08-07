# Movvo ERP — Landing M-2

**URL:** https://movvoerp.com.br  
**App:** `platform/apps/web` route group `(marketing)`  
**API:** `POST /api/v1/marketing/demo-requests`

## Estrutura

- Layout: Navbar sticky + Footer + Analytics env-gated
- Home one-page com âncoras `#recursos`, `#solucoes`, `#integracoes`, `#planos`, `#contato`
- Páginas: `/planos`, `/contato`, `/blog` (stub Em breve)
- SEO: `sitemap.ts`, `robots.ts`, JSON-LD Organization + SoftwareApplication
- Leads comerciais em `marketing_demo_requests` (≠ CRM de alunos da academia)

## Env (web)

```
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_MARKETING_DEMO_SOCIAL=false
```

## Env (API)

```
MARKETING_WEBHOOK_URL=
```

## Migration

`platform/supabase/migrations/20260807_0002_marketing_demo_requests.sql`

## QA

```bash
cd platform
pnpm exec playwright test tests/marketing.smoke.spec.ts
```

Checklist: Lighthouse ≥ 95 (desktop/mobile), a11y teclado, Chromium/Firefox/WebKit, form LGPD + honeypot.

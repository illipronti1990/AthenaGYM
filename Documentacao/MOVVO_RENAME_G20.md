# Movvo G-20 — Rename Athena → Movvo

## Regra

- **Produto:** Movvo ERP (`@movvo/*`)
- **Tenant demo:** Athena Academia (nome preservado)
- **Infra:** slugs Vercel/Render `athena-gym` / `athena-api` permanecem (DNS); ver `platform/DEPLOY.md`

## O que mudou

- 21 workspaces `@athena/*` → `@movvo/*`
- UI: `MovvoDataGrid`, `MovvoChat`, classes CSS `movvo-*`
- SDK: `MovvoClient`
- Theme localStorage `movvo_*` (lê legado `athena_*` e migra)
- Migration `20260812_0001_movvo_g20.sql` (theme produto)
- CI Grep Gate: `platform/scripts/grep-athena-gate.mjs`
- Smoke: `platform/tests/rename.g20.smoke.spec.ts`

## Comandos

```bash
cd platform
pnpm install
node scripts/grep-athena-gate.mjs
pnpm -r run build
pnpm test:e2e -- rename.g20.smoke.spec.ts
```

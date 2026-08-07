# Fase M-4 — UX, Qualidade e Polimento

## Objetivo

Elevar a Movvo de “funciona” para produto de mercado sem novos módulos admin (G-14 depois).

## Entregue

### Fundação (Sprint A)
- `PageState` unificado (`loading` / `empty` / `error` / `forbidden` / `offline`)
- `ConfirmProvider` + `useConfirm` — removidos `window.confirm` do app
- Tokens de densidade (`html.ui-dense`), skip-link, scroll de tabelas

### Responsivo / a11y / perf (Sprint B)
- Skip-link `#athena-main-content`
- Command Palette com `aria-modal` + AbortController
- Dashboard: lazy `RevenueChart` / `CheckinChart` / `DashboardCustomizer`
- Polling pausa com `document.visibilityState`
- Script Lighthouse: `pnpm --filter @movvo/web lighthouse:m4` (landing + login)

### Features aprofundadas (Sprint C)
- Busca: planos, produtos, professores, agenda, settings
- Notificações: filtros por domínio, marcar todas, links de ação, auth no PATCH por `user_id`
- Preferências: densidade, widgets compactos, formato de data, restart do tour (perfil)
- Dashboard: `collapsed`, rollback em falha de save, densidade aplicada

### Tour + QA (Sprint D)
- Tour staff “Bem-vindo → check-in” (`ProductTour`)
- Playwright `tests/ux.m4.smoke.spec.ts`
- Checklist abaixo

## Matriz UX (P0)

| Área | Status | Notas |
|------|--------|-------|
| AppShell / nav | P0 ok | skip-link, densidade |
| Dashboard | P0 ok | lazy charts, customizer |
| Alunos / financeiro / agenda | P0 parcial | estados via componentes existentes + Confirm |
| Command Palette | P0 ok | Ctrl+K |
| Notificações | P0 ok | filtros + mark-all |
| Tour | P0 ok | dismissível |

## Checklist QA

- [ ] Ctrl+K abre palette e Esc fecha
- [ ] Confirmações destrutivas usam dialog (não `window.confirm`)
- [ ] Notificações: filtro + marcar todas
- [ ] Preferências densidade altera shell
- [ ] Tour aparece para staff novo e pode ser pulado
- [ ] Lighthouse landing/login ≥ 95 (performance/a11y best-effort)
- [ ] Mobile 375px: sidebar drawer, tabelas com scroll horizontal

## Fora de escopo

Web Push, i18n EN completo, Lighthouse 95 em todas as rotas `/app/*`, G-14.

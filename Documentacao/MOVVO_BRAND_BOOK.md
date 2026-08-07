# Movvo ERP — Brand Book

**Produto:** Movvo ERP  
**Slogan:** Movimente sua gestão.  
**Versão:** `0.7.0-beta` · Build `2026.08`  
**Domínio:** [movvoerp.com.br](https://movvoerp.com.br) · API [api.movvoerp.com.br](https://api.movvoerp.com.br)  
**Figma:** [Movvo ERP — Brand System](https://www.figma.com/design/FjBTOkBlGkE5QkEcxkoUs7)

## Missão, visão e valores

- **Missão:** Facilitar a gestão das academias através de tecnologia moderna, simples e inteligente.
- **Visão:** Ser o principal ERP para academias do Brasil.
- **Valores:** Simplicidade · Performance · Segurança · Inovação · Inteligência · Confiabilidade

## Nome do produto vs. cliente

| Uso | Nome |
|-----|------|
| Produto SaaS | **Movvo ERP** |
| Assistente IA (UI) | **Movvo AI** |
| Cliente demo / case | **Athena Academia** (permitido) |

## Cores oficiais

| Token | Hex |
|-------|-----|
| Primary | `#D90429` |
| Secondary | `#D4AF37` |
| Background | `#080808` |
| Surface | `#131313` |
| Border | `#2B2B2B` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Info | `#3B82F6` |

## Tipografia

| Papel | Fonte |
|-------|-------|
| Títulos | Sora |
| Texto | Inter |
| Números | JetBrains Mono |

## Design Tokens (canônico)

Fonte: `@athena/theme` → `DesignTokens` em `platform/packages/theme/src/design-tokens.ts`.  
CSS vars espelhadas em `packages/ui/src/styles.css`.

### Spacing / Grid

Escala: **4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64** (`--space-*`).  
Breakpoints: sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536 · ultrawide 1920.

### Motion

| Token | ms | Uso |
|-------|-----|-----|
| fast / hover | 150 | hover, chips |
| normal / dialog | 200 | diálogos |
| toast | 250 | Sonner |
| sidebar | 250 | shell |
| page | 280 | page transition |
| drawer | 300 | drawers |
| slow | 400 | ênfase |
| loading | 800 | spinner loop |

Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (`--motion-easing`).

### Icons

Lucide; strokes **2**. Tamanhos: 16 / 18 / 20 / 24 / 32 (`DesignTokens.icons`).

### Charts

| Semântica | Token / CSS | Hex |
|-----------|-------------|-----|
| Receita | `--chart-revenue` | `#22C55E` |
| Despesa | `--chart-expense` | `#EF4444` |
| Wellhub | `--chart-wellhub` | `#3B82F6` |
| TotalPass | `--chart-totalpass` | `#F97316` |
| Meta | `--chart-goal` | `#D4AF37` |
| Check-ins | `--chart-checkins` | `#D90429` |

Usar `chartColors` de `@athena/ui` / `DesignTokens.charts` — evitar hex hardcoded em hubs BI.

### z-index

sticky 20 · dropdown 40 · sidebar 50 · overlay 60 · modal 70 · toast 80 · command 90.

## Logo

Arquivos em `platform/apps/web/public/brand/` (espelhados em `packages/ui/assets` e `packages/branding/assets`):

- `logo.svg` / `logo-dark.svg` / `logo-light.svg` / `logo-gold.svg` / `logo-white.svg`
- `logo-mark.svg` (ícone)
- Favicons: `favicon.svg`, `favicon-16/32/48/64.png`, `apple-touch-icon.png`, `android-chrome-192/512.png`
- `social-preview.png` (Open Graph 1200×630)
- `manifest.webmanifest`
- **Movvo AI:** `movvo-ai.svg`, `movvo-ai-32.png`, `movvo-ai-64.png`

### Uso correto

- Preferir mark + wordmark em fundos escuros com `logo-dark.svg`.
- Em fundos claros, usar `logo-light.svg`.
- Manter área de respiro ≥ 16px ao redor do mark.
- Contraste AA em botões primary sobre fundo.

### Uso incorreto

- Não distorcer proporção do mark.
- Não recolorir o vermelho para outras paletas fora de white-label do tenant.
- Não usar “ATHENA ERP” como nome de produto (legado).
- Não aplicar o logo do tenant Athena Academia como marca do produto Movvo.

## Mascote Movvo AI

- Mark exclusivo: vermelho Movvo + spark dourado (AI).
- Uso: FAB do chat, header do painel Movvo AI, docs de produto.
- Não usar o mascote como logo principal do ERP (use `logo-mark` / wordmark).
- Não alterar cores do spark para fora da paleta secondary/gold.

## Brand API

`GET /api/v1/branding` (público). Payload: produto Movvo (`name`, `slogan`, `logo`, `favicon`, `colors`, `domain`, `aiName`, `version`, `buildLabel`, `assets`) + `tenant` opcional via header `X-Company-Id`.

Cliente web: `brandingApi.getPublic()`; `BrandingProvider` hidrata fallback do endpoint.

## Feature flags

`GET /api/v1/platform/features` → `{ flags }`.  
Chaves: `inventory`, `crm`, `ai`, `bi`, `pdv`, `marketplace`, `whiteLabel`, `mobile`.  
Override env: `MOVVO_FF_INVENTORY=0`, `MOVVO_FF_WHITE_LABEL=false`, etc.  
Web: `useFeatureFlags()` oculta nav (estoque/PDV/CRM/BI) e FAB AI quando off.

## Systems UI

- **Empty:** `EmptyState` + presets tipados (`EmptyStatePreset` / `emptyPresets`).
- **Loading:** `Skeleton`, `Spinner`, `ProgressBar` (banir loaders ad-hoc nos hubs).
- **Error pages:** `/not-found`, `error.tsx`, `/offline`, `/forbidden` (403), `/too-many-requests` (429) com logo + slogan.
- **Toasts:** variantes success / warning / error / info via Sonner + tokens.
- **Command Palette:** Ctrl+K — atalhos alunos/financeiro/planos/professores; empty/loading alinhados.

## Componentes e tema

- Biblioteca: `@athena/ui` (pacotes npm mantêm escopo `@athena` nesta fase).
- Tokens: `@athena/theme` + CSS vars em `packages/ui/src/styles.css`.
- Product constants: `@athena/shared` / `@athena/branding` (`MOVVO_PRODUCT`).
- Tema: dark / light / system (`localStorage` key `movvo_theme`).
- Footer app: `Movvo ERP · v0.7.0-beta · Build 2026.08`.

## White-label

Tenants configuram via Settings / `companies`: logo, favicon, primary, secondary, background de login.  
Fallback de produto: Movvo ERP. Brand API + `BrandingProvider` aplicam override.

## Open Graph

- Title: Movvo ERP  
- Description: Movimente sua gestão.  
- Image: `/brand/social-preview.png`

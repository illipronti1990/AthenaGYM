# Build context: platform/ (monorepo root)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

RUN pnpm install --frozen-lockfile --filter @movvo/worker...
RUN pnpm --filter @movvo/shared run build
RUN pnpm --filter @movvo/worker run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3011
WORKDIR /app

COPY --from=base /app /app
WORKDIR /app/apps/worker
EXPOSE 3011
CMD ["node", "dist/main.js"]

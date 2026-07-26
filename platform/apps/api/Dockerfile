# Build context: platform/ (monorepo root)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --filter @athena/api...
RUN pnpm --filter @athena/api... run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=base /app /app

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]

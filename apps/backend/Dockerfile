FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter @kore/backend...

FROM deps AS builder
COPY apps/backend/ apps/backend/
RUN pnpm --filter @kore/backend build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter @kore/backend... --prod

COPY --from=builder /app/apps/backend/dist apps/backend/dist

EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]

# Build context: repository root (docker build -f apps/api/Dockerfile .)
FROM oven/bun:1.2 AS base
WORKDIR /app

COPY package.json bun.lock bunfig.toml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/client/package.json ./apps/client/
COPY packages ./packages

RUN bun install --frozen-lockfile

RUN bun run db:generate

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 8080

CMD ["bun", "./src/server.ts"]

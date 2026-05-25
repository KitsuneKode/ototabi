# Build context: repository root (docker build -f apps/worker/Dockerfile .)
FROM oven/bun:1.2 AS base
WORKDIR /app

COPY package.json bun.lock bunfig.toml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/client/package.json ./apps/client/
COPY packages ./packages

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

RUN bun install --frozen-lockfile

RUN bun run db:generate

WORKDIR /app/apps/worker

ENV NODE_ENV=production

CMD ["bun", "./src/index.ts"]

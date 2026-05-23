# Quick Start

## Prerequisites

- **Bun** >= 1.2.0
- **Docker** (for PostgreSQL + MinIO)
- **Node.js** >= 18

## Setup

```bash
# 1. Clone
git clone <repo-url> ototabi
cd ototabi

# 2. Copy env
cp .env.example .env
# Edit .env with your LiveKit credentials

# 3. Start infrastructure
docker compose up -d

# 4. Install dependencies
bun install

# 5. Run database migrations
bun run db:migrate

# 6. Start development
bun dev
```

## Services

| Service       | URL                   | Purpose               |
| ------------- | --------------------- | --------------------- |
| Next.js       | http://localhost:3000 | Frontend app          |
| Express API   | http://localhost:8080 | Backend API + tRPC    |
| PostgreSQL    | localhost:5432        | Database              |
| MinIO API     | localhost:9000        | S3-compatible storage |
| MinIO Console | localhost:9001        | Storage admin UI      |

## Common Tasks

```bash
# Format code
bun fmt

# Check formatting (CI)
bun fmt:check

# Lint
bun lint

# Type check
bun typecheck

# Build all packages
bun run build

# Run tests
bun run test

# Database studio (GUI)
bun run db:studio

# Generate Prisma client after schema changes
bun run db:generate
```

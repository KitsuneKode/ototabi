# Scripts Reference

## Root

| Script        | Command                                     | Description                |
| ------------- | ------------------------------------------- | -------------------------- |
| `dev`         | `turbo run dev`                             | Start all apps in dev mode |
| `build`       | `turbo run build`                           | Build all packages + apps  |
| `lint`        | `oxlint --report-unused-disable-directives` | Lint all files             |
| `fmt`         | `oxfmt`                                     | Format all files           |
| `fmt:check`   | `oxfmt --check`                             | Check formatting (CI)      |
| `typecheck`   | `turbo run typecheck`                       | TypeScript checks          |
| `test`        | `turbo run test`                            | Run all tests (Vitest)     |
| `db:generate` | `turbo run db:generate`                     | Generate Prisma client     |
| `db:migrate`  | `turbo run db:migrate`                      | Run Prisma migrations      |
| `db:studio`   | `turbo run db:studio`                       | Open Prisma Studio         |

## apps/api

| Script      | Description                   |
| ----------- | ----------------------------- |
| `dev`       | Start API with Bun watch mode |
| `build`     | Build API                     |
| `typecheck` | `tsc --noEmit`                |
| `lint`      | — (handled by root oxlint)    |

## apps/client

| Script      | Description                          |
| ----------- | ------------------------------------ |
| `dev`       | Start Next.js dev server (Turbopack) |
| `build`     | Production build                     |
| `typecheck` | TypeScript check                     |
| `lint`      | — (handled by root oxlint)           |

## packages/store

| Script        | Description                          |
| ------------- | ------------------------------------ |
| `db:generate` | `prisma generate`                    |
| `db:migrate`  | `prisma migrate dev`                 |
| `db:seed`     | Run seed script                      |
| `db:studio`   | `prisma studio`                      |
| `db:deploy`   | `prisma migrate deploy` (production) |
| `typecheck`   | `tsc --noEmit`                       |

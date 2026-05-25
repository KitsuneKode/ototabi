# CI/CD Pipeline

## Quality Gates (in order)

```bash
bun fmt:check    # Check formatting (oxfmt)
bun lint         # Lint (oxlint)
bun typecheck    # TypeScript checks (turbo)
bun run test     # Bun test (turbo)
bun run build    # Production build (turbo)
```

## GitHub Actions

```yaml
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun fmt:check
      - run: bun lint
      - run: bun typecheck
      - run: bun run test
      - run: bun run build
```

## Future

- Docker image build for `apps/api`
- Vercel deploy for `apps/client`
- Playwright E2E tests for critical paths (auth, join, record)

# AGENTS.md

## Task Completion Requirements

- All of `bun fmt`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- NEVER run `bun test`. Always use `bun run test` (runs Vitest).

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (tab crashes, network loss,
   S3 errors, session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check
if there is shared logic that can be extracted to a separate module. Duplicate logic
across multiple files is a code smell and should be avoided. Don't be afraid to change
existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Package Roles

- **`apps/client`**: Next.js 16 frontend. Owns pages, layouts, forms, UI components,
  client-side state, recording orchestration, and local storage. Connects to the API
  via tRPC and LiveKit via WebSocket.
- **`apps/api`**: Express API server (Bun). Owns LiveKit token generation, and serves
  the tRPC middleware. Must stay thin — business logic lives in packages.
- **`packages/trpc`**: All tRPC routers + procedures. API boundary. Owns validation,
  auth gating, and response shaping. Delegates to services internally.
- **`packages/store`**: Prisma schema, migrations, Prisma client singleton. Database
  access only — no HTTP or business logic.
- **`packages/auth`**: Better Auth configuration (server + React client). Owns auth
  state, session management, cookie handling.
- **`packages/ui`**: shadcn/ui components, design tokens, global CSS. Owns the retro
  analog theme (LEDs, chassis shadows, mechanical buttons, noise texture).
- **`packages/common`**: Shared types, Zod schemas, ConfigLoader, Winston logger factory.
- **`packages/backend-common`**: Backend-specific config loader.

## Reference Repos

- t3code (reference for OXC toolchain and .docs/.plans patterns): `~/Projects/osc/t3code`
- LiveKit docs: https://docs.livekit.io
- Better Auth docs: https://www.better-auth.com
- Prisma docs: https://www.prisma.io/docs
- shadcn/ui: https://ui.shadcn.com

## Code Quality Standards

### React
- **No inline components** — never define components inside other components.
  Inline components remount on every render, losing state, focus, and animations.
  Extract to module scope and pass props.
- **No barrel imports** — Next.js `optimizePackageImports` is configured for
  `lucide-react`, `date-fns`, and `@radix-ui/*`. Standard imports are fine.
- **No `&&` for number conditions** — use `count > 0 ? <Thing /> : null` instead
  of `count && <Thing />` to prevent rendering `0`.
- **`'use client'` on all interactive pages** — Next.js App Router default is
  server components. All Ototabi pages use client-side state and hooks.
- **Suspense for `useSearchParams`** — not required when page is fully `'use client'`.

### Composition
- **Composition over boolean props** — avoid `isEditing`, `isPreview`, etc.
  Compose explicit variant components instead.
- **Lift state to provider** — state shared across siblings goes into context,
  not prop drilling.

### Performance
- **Date formatting: date-fns** — use `formatDate`, `formatTime`, `formatDateTime`
  from `@/lib/date-utils` instead of manual `toLocaleDateString()`.
- **State management: zustand** — use `@/lib/stores/recording-store` for
  cross-component recording state instead of useState chains.
- **Validation: zod** — all tRPC inputs must use zod schemas. No manual parsing.
- **No module-level mutable state** — don't create request-scoped state at
  module level in RSC or SSR paths (our pages are client-side; this is fine).

## Project Snapshot

Ototabi is a browser-based podcast recording platform — a Riverside.fm alternative. It
records high-quality audio/video locally per participant using LiveKit, uploads tracks
to S3/MinIO via multipart upload, and provides browser-based post-production with
FFmpeg.wasm. The UI follows a retro analog dark mode design language.

Key stack: Next.js 16 (Turbopack), Express + Bun, tRPC 11, Prisma + PostgreSQL,
Better Auth, LiveKit Cloud, MinIO, FFmpeg.wasm, Tailwind CSS v4, shadcn/ui.

---

## Architecture Intent

This project follows module-first organization with clear internal layers.

Framework entrypoints must stay thin. Business logic belongs in services/use-cases.
Database access belongs in repositories/queries. API contracts and validation belong
in DTO/schema files. Permission decisions belong in policies. Response shaping belongs
in mappers.

Keep services framework-agnostic. They should not depend on Express, Hono, Next.js,
or request/response objects.

Do not return raw database objects directly. Map them into response DTOs.

Use PATCH for partial updates. Use PUT only for full replacement.

Do not over-engineer small modules, but split files when responsibilities start mixing.

### Preferred Structure

Module-first at the top, layered inside each module:

```
packages/trpc/src/modules/
  rooms/
    rooms.router.ts      # Thin — procedure binding only
    rooms.service.ts     # Business logic, framework-agnostic
    rooms.repository.ts  # Database access, Prisma queries only
    rooms.policy.ts      # Permission decisions, pure functions
    rooms.dto.ts         # Validation schemas, API contracts
    rooms.mapper.ts      # DB record → API-safe response shape
```

### Dependency Direction

```
router → service → repository → db
```

**Allowed:**

- controller → dto
- controller → service
- service → repository
- service → policy
- service → mapper
- repository → db

**Avoid:**

- repository → service
- repository → controller
- service → req/res or framework-specific HTTP objects
- dto → db
- mapper → controller
- routes → db

### File Responsibilities

**router.ts:** Owns URL, HTTP method, middleware chain, and controller binding. Small and boring. No database calls or business logic.

**service.ts:** Owns business logic and use-case behavior. Coordinates repositories, policies, mappers, and side effects. Framework-agnostic. Accepts plain `{ actorId, postId, data }` objects. Never imports Express/Next request or response types.

**repository.ts:** Owns database/data access. Wraps Prisma queries. No HTTP logic, no business permissions, no API response formatting.

**dto.ts:** Owns API contracts and validation schemas. Use for body, params, and query validation. Query params should be coerced (they arrive as strings). DTOs validate shape, not database/business state.

**mapper.ts:** Converts internal/database records into safe API response DTOs. Prevents leaking private/internal fields.

**policy.ts:** Owns permission decisions. Pure functions: `canUpdatePost`, `canDeleteComment`. No DB access (accept pre-fetched entity).

**middleware.ts:** Owns request pipeline concerns. Auth, logging, request IDs, rate limiting, CORS. Not business workflows.

### tRPC Intent

With tRPC, the `*.router.ts` file replaces routes/controllers. Procedures are the API boundary. Still keep services framework-agnostic. Do not put business logic directly in procedures.

### Validation Intent

Validate all external input at the API boundary: body, params, query, headers if relevant. Frontend validation is only for UX. Backend validation is required for correctness and security.

### Error Handling

Use centralized, consistent error handling. Preferred shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
```

Do not leak raw ORM, SQL, or stack trace errors to clients. Log detailed errors internally.

### Auth and Permissions

Auth middleware identifies the current user and attaches to context. However, important authorization/business rules must still be enforced in the service layer or policy layer. Do not rely only on middleware for critical business permissions.

---

## Design System: Retro Analog

Ototabi uses a distinct retro analog design language inspired by vintage recording
studio equipment, synthesizers, and mechanical interfaces.

See `.docs/encyclopedia.md` for full design tokens, component specs, and conventions.

### Core Philosophy

- **Physicality**: Interfaces feel tactile. Buttons press down, panels are inset.
- **Utilitarian Elegance**: Form follows function. Monospace fonts for values/data.
- **Lighting**: Elements illuminate. Inner shadows and glow simulate LED behavior.

### Design Engineering Principles (Emil Kowalski)

1. **Custom Easings**: Never use `ease-in`. Mechanical curve: `cubic-bezier(0.1, 0.9, 0.2, 1)`.
2. **Tactile Buttons**: Buttons shrink on press. `active:translate-y-[2px]` + shadow compression.
3. **Interruptible UI**: CSS transitions over keyframes for rapidly triggered states.
4. **No scale(0) Entrances**: Enter from `scale(0.95)` with `opacity: 0`, never pop from nothing.
5. **Blur over Crossfades**: Use `filter: blur(2px)` to bridge jarring visual state gaps.

### Rules for Code Generation

1. Use Shadcn structural components, heavily modify Tailwind classes for analog theme.
2. Inputs, textareas, video containers → recessed LCD screen (inset shadows, dark bg).
3. Containers (Card, Dialog) → hardware chassis (gradients, drop shadows, top highlight).

### Typography

- **Labels/Headings**: Oswald (sans-serif, all caps)
- **Values/Data/Screens**: Courier Prime (monospace)

### Key Components

- `AnalogCard` — hardware chassis container (bevel + drop shadow)
- `AnalogInset` — recessed panel (inner shadow, for displays/meters)
- `Led` / `LedInline` — colored indicator lights (red/amber/green, pulse animation)
- `MonoLabel` — monospace label (Courier Prime, uppercase, tracking-widest)
- `PanelTitle` — section header with optional sub-label
- `StatusBadge` — inline pill badge (variants: default, recording, ok, warn)
- `NoiseBackground` — fullscreen SVG noise texture overlay
- `MechButton` — mechanical press-down button (btn-mechanical CSS utility)

---

## When to Split Files

Split when there is real pressure:

- Route handler grows beyond ~30 lines
- Permission logic appears more than once
- Response mapping appears more than once
- DB calls leak into controllers
- Service has unrelated methods
- Shared infrastructure is used across modules

Prefer clarity over abstraction. Don't create files just to look professional.

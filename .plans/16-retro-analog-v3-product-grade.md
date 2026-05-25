# Plan 16: Retro Analog v3 — Product-Grade Consistency

**Status:** in-progress  
**Priority:** P0 (perception + auth unblock)  
**Depends on:** Plan 14 (done), Plan 15 (in-progress), Plan 13 Phase 0

## Problem

Retro Analog v2 shipped shells and a richer landing, but the product still does not read as **premium end-to-end**:

1. **Auth broken in dev** — Client on `:3000`, API on `:8080` → session cookies never attach to tRPC (gated dashboard, console errors).
2. **Register drift** — Marketing uses `ProductShell`; studio/join/recording review pages still use one-off layouts (`min-h-screen`, duplicate gates).
3. **Plan README stale** — Plans 12–15 status does not match shipped work (AppShell, landing pricing, recording events).
4. **Missing pages** — No dedicated `/pricing`, `/demo` polish, or comparison content for evaluators.
5. **Token leaks** — Some pages use raw `h-screen`, duplicate auth gates, inconsistent empty/error states.
6. **Mockups confuse** — `/mockups` explores non-product aesthetics; no banner that production = Retro Analog only.

## Retro Analog v3 direction

**Not a new aesthetic** — tighten v2 into one vocabulary:

| Layer      | v3 rule                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| Surfaces   | Chassis (`AnalogCard`) + inset (`AnalogInset`) only; no nested card stacks            |
| Accent     | Amber = signal (REC, primary CTA, focus). Never body text or decorative fills         |
| Typography | Oswald (structure), Source Sans (body), Courier Prime (data) — enforced per DESIGN.md |
| Motion     | Press `scale(0.96)` + mechanical ease; enter `scale(0.96)` + opacity; exits faster    |
| Density    | Brand = airy chapters; Product = daily app; Studio = cockpit (Plan 12)                |

**Signature upgrade:** Channel-strip status rail on every session surface (studio, session review, export) with live LED semantics tied to `RecordingEvent` + upload state.

## Solution

### Phase 0 — Auth & API same-origin (blocking)

- Next.js `rewrites` proxy `/api/auth`, `/api/trpc`, `/api/token`, `/api/guest-auth` → Express
- Browser `authClient` + tRPC use same-origin paths (`getApiBaseUrl()` → `''` in browser)
- `autoSignIn: true` after email sign-up
- Dashboard gate links to `/auth/signin` + sign-up path

**Acceptance:** Sign up → dashboard loads rooms without `SYSTEM ACCESS GATED` or tRPC spam.

### Phase 1 — Plan hygiene & governance

- Sync `.plans/README.md` with reality
- Add mockups banner: exploratory only
- Extend DESIGN.md with v3 checklist (register split, page inventory)

### Phase 2 — Page inventory (product-grade)

Migrate remaining surfaces to shared shells and designed states:

| Page                   | Shell             | States needed           |
| ---------------------- | ----------------- | ----------------------- |
| `/`                    | ProductShell      | done                    |
| `/auth/*`              | AuthShell         | done                    |
| `/dashboard`           | AppShell          | loading / empty / error |
| `/settings`            | AppShell          | done                    |
| `/recovery`            | AppShell          | empty recoverable       |
| `/recordings/[id]`     | AppShell          | timeline + tracks       |
| `/export/[id]`         | AppShell          | progress + error        |
| `/rooms/[id]/join`     | JoinShell (new)   | guest + host paths      |
| `/chat/[id]`           | StudioShell (new) | preflight + studio      |
| `/rooms/[id]/settings` | AppShell          | invites                 |
| `/pricing`             | ProductShell      | new dedicated page      |
| `/demo`                | ProductShell      | scripted walkthrough    |

Extract `JoinShell` / `StudioShell` from inline page layout (no inline components).

### Phase 3 — Brand completion

- `/pricing` — tiers (Creator / Pro / Self-host), chassis cards, FAQ cross-link
- Landing: screenshot or waveform loop in CRT mock (CSS only)
- Social proof row (no fake names — use role-based quotes)
- Comparison strip: stream tools vs local masters (1 table, not 3 equal cards)

### Phase 4 — Component system hardening

- `SessionTimeline` — shared across recordings + export
- `UploadStatusBadge` — unified states from Plan 13
- `EmptyState` / `ErrorState` pattern components (chassis + mono copy + action)
- Concentric radius audit on all `AnalogCard` > `AnalogInset` nests
- Replace `h-screen` with `min-h-[100dvh]` on product pages

### Phase 5 — Studio cockpit (Plan 12 + 15-D)

- Mobile off-canvas participants
- Keyboard overlay styling pass
- `focus-visible` on all icon controls
- Recording consent + health panel

## Relationship to other plans

```
Plan 16 Phase 0 (auth)     ──► unblock all product pages
Plan 13 Phase 0 (trust)    ──► parallel — premium UI fails without it
Plan 15 Phases C–F         ──► subsumed into 16 Phase 2–5
Plan 12                    ──► studio slice inside 16 Phase 5
Plan 14                    ──► foundation; 16 is consolidation pass
```

**Recommended order after Phase 0:**

1. Phase 2 page inventory (join + studio shells)
2. Phase 3 brand (`/pricing` + landing comparison)
3. Phase 4 patterns (timeline, upload badge, empty/error)
4. Phase 5 studio mobile

## Acceptance criteria

- [ ] Auth works: sign-in/sign-up → dashboard with data (no gated screen when session valid)
- [ ] All product routes use AppShell, JoinShell, or StudioShell
- [ ] `/pricing` exists and matches landing tier copy
- [ ] No `h-screen` on user-facing product pages
- [ ] Craft checklist in DESIGN.md passes on landing + dashboard + studio
- [ ] `bun fmt`, `bun lint`, `bun typecheck` pass

## Files (Phase 0 — shipped in this initiative)

- `apps/client/next.config.js` — API rewrites
- `apps/client/lib/api-base.ts` — browser vs server API origin
- `packages/auth/src/client.ts` — same-origin auth base URL
- `packages/auth/src/index.ts` — `autoSignIn: true`
- `apps/client/trpc/client.tsx`, `vanilla.ts` — proxied tRPC URL
- `apps/client/app/chat/[roomId]/page.tsx`, `join/page.tsx` — `apiUrl()`
- `apps/client/app/dashboard/page.tsx` — sign-in gate copy

# Plan 17: Handoff — Remainder Work

**Status:** done  
**Priority:** P0 (execution order for next sessions)

This file is the single checklist after auth/guest/studio/marketing land (commits `eed65fe`, `a2be124`, `6ee71ee` on `main`).

## Before you code (every session)

```bash
cp .env.example .env          # if missing
# BETTER_AUTH_URL=http://localhost:3000
# LIVEKIT_* + NEXT_PUBLIC_LIVEKIT_URL must match
docker compose up -d
bun run db:migrate
bun dev
```

Smoke: host sign-in → dashboard → create room → create invite → guest incognito with `?invite=` → studio connects.

---

## Phase A — Plan 01 (guest join, finish)

| Task                                                                                          | Acceptance                                      |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Block `role: guest` from `/dashboard`, `/settings`, `/recovery` (redirect to join or sign-in) | Guest cannot open host console                  |
| Show `Guest: {name}` in studio sidebar / participant list                                     | Visible label in studio                         |
| Optional: default “lobby” invite auto-created with room                                       | Host copy link works without manual invite step |

**Files:** middleware or layout guard, `app-shell` nav, studio participant UI, optionally `rooms.service` on `createRoom`.

---

## Phase B — Plan 16 (product grade UI)

| Task                                                 | Acceptance                                    |
| ---------------------------------------------------- | --------------------------------------------- |
| `/pricing` page (Analog theme, tiers from landing)   | Route exists, linked from header/footer       |
| `JoinShell` / `StudioShell` wrappers                 | Join + studio share chrome with product shell |
| Shell on remaining routes (export, recordings, join) | Consistent `AppShell` / `PageHeader`          |

**Files:** `apps/client/app/pricing/page.tsx`, layout components under `components/layout/`.

---

## Phase C — Plan 13 Phase 1 (trust hardening)

| Task                                               | Acceptance                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| Private S3 objects; signed GET for playback/export | No public MinIO bucket in prod path                                             |
| Worker reads tracks via SDK/signed URL             | Transcript processor works without public URLs                                  |
| Upload/session status on recordings page           | All states visible: recording → finalizing → uploading → complete / recoverable |

**Files:** `uploads.service`, `docker-compose` init, worker processors, `recordings/[sessionId]/page.tsx`.

---

## Phase D — Plan 03 (sync markers)

| Task                                                | Acceptance                       |
| --------------------------------------------------- | -------------------------------- |
| Persist + display marker timeline on session review | Host sees JOIN/STOP/sync markers |
| Export uses marker offsets                          | FFmpeg export alignment improved |
| LiveKit RTP / clock docs in code comments           | Future alignment path documented |

**Files:** `sync-markers` module, recordings/export pages, studio emit (partially done).

---

## Phase E — Plan 04 (transcript)

| Task                                                              | Acceptance                  |
| ----------------------------------------------------------------- | --------------------------- |
| End-to-end: stop session → queue job → Whisper → store transcript | Session has transcript JSON |
| UI: transcript panel on recordings page                           | Readable, word timestamps   |
| Requires `OPENAI_API_KEY`, Redis, worker running                  | Documented in quick-start   |

**Files:** `apps/worker`, `rooms.service` queue trigger, client transcript view.

---

## Phase F — Plan 12 / 15 (polish)

| Task                                              | Acceptance                 |
| ------------------------------------------------- | -------------------------- |
| Studio mobile layout (stack controls, safe areas) | Usable on narrow viewport  |
| Keyboard overlay complete on studio               | `?` shows all shortcuts    |
| Focus-visible on mechanical controls              | a11y pass on primary flows |

---

## Backlog (P2, after above)

| Plan | Summary                          |
| ---- | -------------------------------- |
| 02   | OPFS-primary recovery edge cases |
| 05   | Text-based editing               |
| 06   | AI chapters/clips/notes          |
| 07   | Multi-track timeline editor      |
| 08   | Polar billing                    |
| 09   | YouTube distribution             |
| 10   | OXC migration completion         |
| 11   | Module-first refactor sweep      |

---

## Suggested PR split (if shipping to remote)

1. `fix/auth-proxy-guest` — already committed as eed65fe
2. `refactor/studio-connection` — a2be124
3. `feat/guest-marketing-docs` — 6ee71ee

Or one PR: `feat: auth proxy, guest sessions, studio refactor` (all three).

---

## Known limitations (do not re-debug unless regressing)

- Guests **must** use invite URL (`?invite=`); plain room code is intentional (Plan 13).
- `BETTER_AUTH_URL` must be browser origin (`:3000`), not Express `:8080`.
- Uploads mock without `AWS_*` env — set MinIO vars for real S3.

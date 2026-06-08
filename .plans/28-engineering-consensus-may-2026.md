# Plan 28: Engineering & Product Consensus (May 2026)

**Status:** parity-v1 consensus record; superseded by Plan 31 for execution order  
**Priority:** P0 (alignment before large PRs)  
**Audience:** founders, implementers, agents

This plan consolidates what is **shipped**, **partial**, and **blocked**, plus **architecture decisions** that needed shared agreement for the parity-v1 milestone. It remains the parity-v1 consensus record. Current operational execution order for production hardening and architecture cleanup lives in [Plan 31](31-production-hardening-master-plan.md). Plan 30 remains a draft v1.1 scope proposal until reconciled with that hardening order.

Deferred v1.1 features may continue to be planned, but they should not be built ahead of sync/export reliability and architecture cleanup.

---

## 1. Where we are (truth table)

| Area               | Reality on `main`                                                                                                     | Doc/plan gap                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Trust & upload** | Upload sessions, ownership policy, Plan 27 pool, private S3, recovery                                                 | Plan 02 edge cases; Plan 03 RTP still TBD                                            |
| **Studio access**  | Invites, lock, admit/deny, `enterStudio`, preflight, consent, health, mute/remove, co-host policy                     | Smoke/staging validation pending                                                     |
| **Session review** | `sessionReview.get` bundle, export console zustand                                                                    | —                                                                                    |
| **AI pipeline**    | Whisper → LLM → clips; status + dedup                                                                                 | Plan 06: regen UX, filler words, monthly clip caps                                   |
| **Text editing**   | `TranscriptEditor` + FFmpeg cut concat on export page                                                                 | Plan 05 marked TBD but **cuts ship in browser**; server gate + preview polish remain |
| **Billing**        | Dodo checkout + webhook, plan gates, trial transcript teaser, trial session cap, Creator clip cap, export Pro UI gate | Smoke/staging validation pending when `DODO_PAYMENTS_API_KEY` set                    |
| **Export**         | Browser FFmpeg + worker presets + ZIP bundles (Plan 09 v1)                                                            | Server FFmpeg for long sessions (Plan 13 Phase 4)                                    |
| **Architecture**   | Most domains under `packages/trpc/src/modules/*`                                                                      | Plan 11: rooms.router still ~200 lines; legacy `routers/` for auth/billing/user      |
| **Deploy**         | Railway doc exists; split client/API                                                                                  | Operator: push + migrate + smoke                                                     |

---

## 2. Consensus: product priorities (next 6–8 weeks)

Order reflects **reliability → monetization → differentiation → scale**.

### Wave A — Operator & revenue (1–2 days, little code)

1. `git push` + `bun run db:migrate`
2. [try-local-smoke.md](../.docs/try-local-smoke.md) full path
3. Dodo dashboard: products, `DODO_PRODUCT_*`, webhook → `/api/dodo-webhook`
4. Confirm plan gating in staging with a Trial test user (403 on clips regen, Pro for transcript retry)

### Wave B — Studio trust (Plan 13 Phase 2) — **landed in code; smoke pending**

| Item                     | Why                      | Acceptance                                                                             |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------- |
| **Preflight route**      | Reduces failed sessions  | **Landed** — mic/camera/storage/network checks before `enterStudio`; smoke pending     |
| **Recording consent**    | Legal + Riverside parity | **Landed** — participants acknowledge before local capture; smoke pending              |
| **Session health panel** | Host sees risk early     | **Landed** — per-participant connection, OPFS, upload queue, devices; smoke pending    |
| **Host controls**        | Production feel          | **Landed** — mute request, remove guest, and shared recording indicator; smoke pending |

**Architecture note:** Preflight and health should read from **one studio readiness module** (`apps/client/lib/studio/readiness.ts`) fed by existing upload/recorder stores — avoid duplicating device logic in page components.

### Wave C — Monetization hardening (Plan 08 follow-up) — **P1**

| Item                                              | Status                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `requirePlan` on clips mutations                  | **Done** (Creator+)                                                                   |
| `requirePlan` on chapters/show notes              | **Done** (Pro+)                                                                       |
| Host plan check before Whisper queue              | **Done** (Pro+ when Dodo configured)                                                  |
| Trial session cap (3)                             | **Done in code** — staging smoke pending when Dodo gates are active                   |
| Creator 10 clips/month                            | **Done in code** — staging smoke pending when Dodo gates are active                   |
| Client export: disable Pro-only actions for Trial | **Done in code** — export Pro UI gate landed; staging smoke pending                   |
| Text-edit (browser FFmpeg cuts)                   | **Done in code** — browser cuts remain client-side and UI-gated to Pro; smoke pending |

### Wave D — Post-production depth — **P1/P2**

| Plan   | Focus                                                                       |
| ------ | --------------------------------------------------------------------------- |
| **05** | Preview-before-cut UX, multi-track cut parity, document shipped FFmpeg path |
| **06** | Regenerate AI artifacts, filler-word suggestions, noise reduction toggle    |
| **03** | Sync marker export alignment + RTP path doc                                 |
| **07** | Multi-track timeline (large; after 05 stable)                               |

### Wave E — Architecture debt (Plan 11) — **ongoing, not a big-bang**

- **Rule:** every new procedure goes in `modules/<domain>/` with service/repository/policy.
- **Debt:** `rooms.router.ts` still binds many procedures — split `recordings.*` out when touching sessions.
- **Enums:** replace string statuses in API responses with Prisma enums via mappers.
- **Do not return raw Prisma** from procedures (session-review mapper is the pattern).

### Wave F — Deploy & CI — **when staging exists**

- Vercel: `apps/client` only
- Railway/Fly: API + worker + Redis + Postgres + MinIO
- Cross-origin auth: `BETTER_AUTH_URL` = browser origin (`:3000`)

---

## 3. Architecture decisions (need agreement)

### ADR-1: Source of truth for media

| Layer                     | Source of truth                           |
| ------------------------- | ----------------------------------------- |
| **Quality**               | Local OPFS/IndexedDB per participant      |
| **Ownership & lifecycle** | Server `UploadSession` + `RecordingTrack` |
| **Playback/export**       | Signed GET URLs, never public buckets     |

**Implication:** Workers and LLM never assume public `s3Url`; always sign or SDK read.

### ADR-2: Billing entity

| Question                  | Consensus                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Who pays for Whisper/LLM? | **Room host** (`Room.creatorId`), not guest                                              |
| When are gates enforced?  | When `DODO_PAYMENTS_API_KEY` is set; local dev bypasses                                  |
| Guest access to AI?       | Guests never call host AI mutations; clips list may be read-only for collaborators later |

### ADR-3: Export split (browser vs worker)

| Session size                          | Path                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Short / cuts / preview                | Browser FFmpeg.wasm (current)                                                  |
| Long / episode render / clips burn-in | BullMQ `export` queue (partially wired via `sessionReview.queueSessionExport`) |

**Do not** block browser export on worker availability; **do** gate expensive server renders on plan + queue health.

### ADR-4: Module-first migration strategy

```
router (≤30 lines) → service → repository
                      ↘ policy, mapper, dto
```

- Refactor **on touch**, not freeze-the-world.
- Priority order: `uploads` (done), `rooms/recordings` (split next), `export` (done), `transcript` + `clips` (thin routers already).

### ADR-5: Creator Suite lanes (locked in Plan 19)

| Lane   | Year-1 bet  | Gate               |
| ------ | ----------- | ------------------ |
| Studio | Primary     | Plan 13 Phase 0–2  |
| Clips  | AI moat     | Plan 06 + billing  |
| Demo   | After trust | Plan 24 shipped v1 |
| Reels  | After clips | Plan 26 batch      |

---

## 4. Implementation notes (May 2026 session)

### Plan gating (Plan 08 follow-up)

- `packages/billing/src/plan-policy.ts` — tier order, trial expiry, Dodo bypass
- `creatorProcedure` / `proProcedure` / `hostProProcedure` in `packages/trpc/src/trpc.ts`
- Clips mutations → Creator+
- Transcript chapters/show notes → Pro+
- Auto Whisper schedule → host Pro+ when billing configured
- `scheduleTranscript` may return `{ status: "plan_upgrade_required" }`

### Plan 05 correction

Text-based **cut export is implemented** in `export/[sessionId]/page.tsx` (`handleCuts`). Remaining work: preview UX, plan-aware UI disable, and acceptance tests in smoke doc.

---

## 5. Grill locked decisions (May 2026 session)

### Milestone & scope

| Decision                         | Locked choice                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Target milestone**             | **Riverside parity** (broader than “paid beta only”) — studio trust + post-production + **timeline MVP** + demo ~60% Screen Studio-like |
| **Explicit cuts from parity v1** | No podcast hosting/RSS, no live multistream, no AI producer in-room, no workspace memory, no native mobile apps                         |
| **GTM**                          | **Ototabi Cloud primary**; self-host supported but secondary engineering priority                                                       |
| **YouTube v2**                   | **Export bundle + manual upload** only — no OAuth in parity milestone                                                                   |
| **Deploy staging**               | **After Wave B** studio trust (preflight, consent, health) — then dogfood before timeline                                               |

### Billing & trials

| Decision                | Locked choice                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Trial transcript**    | **1 lifetime Whisper run per trial host**, then block + upgrade CTA; **local dev bypass** when `DODO_PAYMENTS_API_KEY` unset (existing behavior) |
| **Trial recording cap** | **Enforce before public beta** (not necessarily this week) — 3 completed sessions on Trial                                                       |
| **Clip monthly cap**    | **Enforce before paid beta** — DB `UsageCounter` (or equivalent); Creator 10/mo on regenerate + render                                           |
| **Text-based cuts**     | **Pro+** — disable cut mode in export UI for Trial/Creator; browser FFmpeg stays client-side                                                     |
| **API gates (shipped)** | Clips mutations Creator+; chapters/show notes Pro+; auto-Whisper host Pro+ when Dodo configured                                                  |

### Studio trust (Plan 13)

| Decision              | Locked choice                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preflight**         | **Warn by default**; hard block only on critical failures (no required camera, storage exhausted, unsupported browser)                                                       |
| **Consent**           | **Before local capture starts** — all participants; host sees consent state in health panel                                                                                  |
| **Host controls v1**  | **Mute request + remove guest + recording indicator** in first control batch                                                                                                 |
| **Co-hosts / admins** | **Multiple room leaders** — extend policy so `RoomMember.role === "host"` (not only `creatorId`) can admit, remove, mute-request, lock; document in rooms.policy + studio UI |
| **Health panel**      | Ship with Wave B/C — per-participant connection, OPFS, upload queue, devices                                                                                                 |

### Export, sync, AI

| Decision               | Locked choice                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Long export**        | **Worker-first** for episode/vertical burn-in; browser for cuts/trim/short merge                        |
| **Sync (Plan 03)**     | **Marker timeline + export warnings before beta**; RTP/sub-50ms alignment documented, not blocking beta |
| **AI regen (Plan 06)** | **After timeline MVP** — retention, not acquisition blocker                                             |

### Demo lane (~60% Screen Studio / OpenScreen)

| Decision                        | Locked choice                                                                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delivery**                    | **Two-track:** (A) **Browser v1.1** in ~2–3 weeks; (B) **Thin “Ototabi Capture”** companion (Tauri or Electron) in ~6–8 weeks — same session/upload API, **edit/export stay in web app** |
| **Why not browser-only**        | Browser ~40–50% parity (post-render zoom, WASM limits, no global cursor); desktop capture app matches OpenScreen APIs without rewriting whole product in Electron                        |
| **Browser v1.1 feature bundle** | Auto-zoom from cursor (`suggest-zoom-from-cursor` + preview), PiP webcam on export, trim + speed, background blur/gradient presets                                                       |
| **Not in v1.1 bundle**          | GIF export, styled click ripples (can follow), full desktop clone                                                                                                                        |
| **Demo/Reels freeze**           | **No new Reels expansion** until parity bar; demo gets v1.1 + companion path (not maintenance-only freeze)                                                                               |

### Build order (confirmed)

1. Billing UI + usage caps (trial transcript counter, session cap, clip cap)
2. Studio trust — preflight, consent, mute/remove/indicator, **co-host policy**
3. Session health panel
4. Demo browser v1.1 (auto-zoom, PiP, trim/speed, backgrounds)
5. Worker export hardening (long sessions)
6. Timeline MVP (lanes, scrub, trim handles)
7. AI regen + artifact edit
8. Capture companion — spec + MVP recorder uploading to existing `demo.*` / session API

### Open (minor — decide during implementation)

- **OXC migration (Plan 10):** Finish in parallel with studio PRs; do not block preflight on OXC
- **Dodo metered vs DB counter:** Start with DB counter; migrate to provider metering if needed

---

## 6. PR-sized backlog (consensus build order)

| PR  | Scope                                         | Plans  |
| --- | --------------------------------------------- | ------ |
| 1   | Plan gating + client billing badges           | 08     |
| 2   | Studio preflight + consent banner             | 13     |
| 3   | Session health panel                          | 13     |
| 4   | Export console plan-aware + text-edit preview | 05, 08 |
| 5   | AI regen + artifact edit                      | 06     |
| 6   | Sync export alignment warnings                | 03     |
| 7   | rooms → recordings router split               | 11     |
| 8   | Timeline editor MVP                           | 07     |

---

## 7. Definition of done — milestone: Riverside parity v1

- [ ] Smoke doc passes on clean machine + staging
- [x] Trial: 1 lifetime transcript, 3 session cap, clip cap when Dodo configured
- [ ] Pro host: record → upload → transcript → chapters → export bundle (browser + worker long path)
- [x] Studio: lock/admit + **co-host controls** + consent + preflight + health + mute/remove/indicator
- [x] Timeline MVP on export/review (lanes, scrub, trim)
- [x] Demo browser v1.1 bundle shipped; Capture companion spec approved (build may trail beta)
- [x] Sync markers visible; export warns on low confidence
- [x] No public media URLs in prod
- [x] Explicit cuts documented: no hosting, live stream, AI producer, workspace memory, mobile apps

---

## References

- [Plan 13 — Riverside roadmap](13-riverside-competitive-roadmap.md)
- [Plan 19 — Creator Suite vision](19-creator-suite-vision.md)
- [Plan 08 — Billing](08-billing-stripe-subscriptions.md)
- [Prior session transcript](a0703cdf-5a64-4c43-8bd8-35f7c0ceb079)

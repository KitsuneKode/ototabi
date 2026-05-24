# Plan 15: Premium UX Master Plan (Impeccable + Interface Design + Bencium)

**Status:** in-progress  
**Priority:** P1  
**Depends on:** Plan 14 (in-progress), Plan 13 Phase 0 (trust), Plan 12 (studio polish)

## Why this plan exists

Engineering plans (01–13) and Plan 14 cover _what to build_. This plan covers _how it must feel_ so Ototabi reads as a premium, trustworthy studio product—not a generic SaaS shell or an internal admin tool.

It merges three design workflows:

| Framework            | Role in Ototabi                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Impeccable**       | PRODUCT.md / DESIGN.md context, register split (brand vs product), slop bans, OKLCH discipline |
| **Interface Design** | Domain-first intent, subtle elevation, token naming, dashboard craft                           |
| **Bencium**          | Bold aesthetic commitment, atmosphere, accessibility, anti–AI-slop typography/color            |

---

## Step 0: Design governance (do first)

**Problem:** No `PRODUCT.md`, `DESIGN.md`, or `.interface-design/system.md`. Every session re-derives decisions → drift and generic output.

**Action:**

1. Run `$impeccable teach` (or hand-write) **`PRODUCT.md`** at repo root:
   - Users: bootstrap podcasters, small creator teams, self-host operators
   - Job: invite → record local masters → survive failures → align → publish
   - Anti-references: Riverside clone UI, purple SaaS gradients, glassmorphism, hero-metric templates
   - Register field: `brand` for marketing; `product` for app surfaces

2. Run `$impeccable document` (or hand-write) **`DESIGN.md`**:
   - Direction: **Retro Analog v2** — vintage rack gear, not neon retrowave
   - Color strategy: **Committed** on brand (amber signal on charcoal); **Restrained** in product UI
   - Typography: Oswald (structure) + Courier Prime (data) — already in codebase; document scale
   - Depth: borders-first + chassis shadows; no glass default
   - Motion: `--ease-mechanical` press, `--ease-out` enter, no page-load choreography in app

3. After first shipped slice, save **`.interface-design/system.md`** (elevation scale, spacing unit 4px, signature checklist).

**Acceptance:** A new agent can read PRODUCT + DESIGN and produce on-brand UI without re-reading mockups.

---

## Interface Design — required exploration (locked for Ototabi)

### Domain (territory, not features)

Patch bay · channel strip · VU / peak LED · reel-to-reel · isolation booth · tally light · CRT monitor · punch-in / cue · headroom · bus routing

### Color world (physical studio)

| Color          | Where it lives                                   |
| -------------- | ------------------------------------------------ |
| Amber / orange | REC tally, peak warning, primary signal accent   |
| Warm charcoal  | Rack faceplate, chassis body (dark mode default) |
| Aged beige     | Light-mode tolex / panel wrap                    |
| Matte black    | CRT bezel, inset display well                    |
| Dull green     | SYNC / online / upload complete LEDs             |
| Deep red       | Record armed / error / destructive               |
| Faded cream    | Silk-screen labels, mono metadata text           |

### Signature (only Ototabi)

**The REC tally + CRT inset mock** — a living “channel strip” hero where status is shown as hardware LEDs and a scanlined display, not abstract illustration or stock UI screenshots.

### Defaults to reject

| Default                                   | Replacement                                         |
| ----------------------------------------- | --------------------------------------------------- |
| 3 equal icon feature cards                | Asymmetric bento + `grid-flow-dense`                |
| Sidebar different bg from canvas          | Same `--background`, `border-r` separation          |
| Purple / blue SaaS accent                 | Single amber `--accent`                             |
| Glass / aurora mockups (`/mockups` 9, 3)  | Archive; do not merge into product                  |
| Hero metric template (big number + label) | Signal strip with `tabular-nums` technical readouts |
| `scale(0)` modal enter                    | `scale(0.96)` + opacity                             |
| Plan copy in FAQ (“Plan 13…”)             | User-facing benefit language only                   |

---

## Intent (answer before every screen)

**Who:** A creator at a desk or kitchen table, 30–60 minutes before/during a remote interview or podcast. Anxious about losing a guest track or looking unprofessional.

**Verb:** Start a session, monitor recording health, recover after a crash, export aligned masters.

**Feel:** _Warm mechanical precision_ — like leaning over a real desk mixer: tactile, serious, not playful toy, not cold fintech.

**Scene sentence (theme):** “Operator in a dim room, glancing at amber tally lights and monospace session timers on a charcoal console—not a bright white SaaS dashboard.” → **Dark default** is correct.

---

## Register split (Impeccable)

### Brand register (`brand`)

**Surfaces:** `/`, `/pricing` (new), `/demo`, future `/about`, campaign sections.

**Color strategy:** **Committed** — amber carries 30–40% of emphasis (LEDs, badges, CTAs, section rules).

**Layout:** Asymmetric hero, chapter spacing (`py-20 md:py-28`), left-aligned copy, CRT device mock.

**Motion:** Staggered enter on landing only; no blocking interaction.

**Bans:** Gradient text, glass cards, editorial serif lanes, meta labels (“SECTION 01”), fake testimonial grids.

**Plan 14 status:** Foundation shipped — extend with pricing, social proof strip, comparison table, screenshot/video loop in CRT mock.

### Product register (`product`)

**Surfaces:** `/dashboard`, `/chat/[roomId]`, `/rooms/*`, `/recordings/*`, `/export/*`, `/recovery`, `/settings`.

**Color strategy:** **Restrained** — amber only for primary actions, recording state, and critical alerts.

**Layout:** Predictable app chrome — **AppShell** (nav + context), not marketing header.

**Density:** Studio = cockpit (Plan 12); dashboard = daily app mode.

**Motion:** 150–250ms state transitions; **no** landing-style stagger on load.

**Bans:** Decorative motion, display typography in data tables, nested cards, reinvented modals.

---

## Bencium — aesthetic commitment (no half measures)

**Chosen direction:** **Industrial / utilitarian retro analog** (not maximalist chaos, not glass aurora).

**Alternatives considered (not pursuing unless you redirect):**

| Option                      | Tone                    | Trade-off                                   |
| --------------------------- | ----------------------- | ------------------------------------------- |
| A. Retro Analog v2 ✓        | Warm rack gear          | Best fit for existing tokens + encyclopedia |
| B. Tactical Rust (mockup 5) | Hazard orange, military | Strong but fights warm amber brand          |
| C. Mono Sand (mockup 2)     | Editorial serif         | Wrong register for a studio tool            |

**Atmosphere tools allowed:** noise texture (fixed overlay), chassis shadows, scanlines, subtle inset glow on LEDs — **not** blob gradients or backdrop blur panels.

---

## Craft checklist (run before merging UI PRs)

### Interface Design mandate

- [ ] Swap test: Would swapping Oswald for Inter change nothing? If yes, typography is still defaulting.
- [ ] Squint test: Hierarchy visible without harsh borders?
- [ ] Signature test: Point to 5 places REC/CRT/LED language appears.
- [ ] Token test: CSS vars sound like a studio (`--accent`, `--popover`), not `gray-700`.

### Impeccable

- [ ] No side-stripe borders, gradient text, glassmorphism, hero-metric template.
- [ ] No em dashes in user-facing copy.
- [ ] OKLCH neutrals tinted warm (already in Plan 14 tokens).

### Bencium / a11y

- [ ] 44×44px touch targets (mobile menu, studio controls).
- [ ] `focus-visible` rings on all interactives (Plan 12).
- [ ] `prefers-reduced-motion` respected (globals.css already has block).

---

## Phased rollout

### Phase A — Governance (1 PR, no UI)

- Add `PRODUCT.md`, `DESIGN.md`, `.interface-design/system.md`
- Update Plan 14 acceptance criteria to reference DESIGN.md
- Deprecate `/mockups` in README or add banner: “Exploratory only — production uses Retro Analog v2”

### Phase B — Brand completion (Plan 14 finish)

| Item             | Detail                                                        |
| ---------------- | ------------------------------------------------------------- |
| Pricing section  | Chassis cards, 2 tiers, honest “self-host” tier               |
| Trust strip      | Logos or “Built for creators who…” quote row (no fake names)  |
| CRT mock upgrade | Optional subtle loop / waveform animation in inset (CSS only) |
| Theme toggle     | Header sun/moon; keep dark default                            |
| Copy pass        | Remove engineering plan references from FAQ                   |

### Phase C — Product shell (`AppShell`)

New primitives:

- `AppShell` — same bg as canvas, left nav (collapsible), user block, room context
- `PageHeader` — `PanelTitle` + actions row
- `SessionStatusRail` — LEDs for recording / upload / sync (ties to Plan 13 events)

Migrate in order:

1. `/dashboard`
2. `/settings`
3. `/recordings/[sessionId]`
4. `/recovery`
5. `/export/[sessionId]`

### Phase D — Studio cockpit (Plan 12 + product register)

- Mobile: off-canvas participants, bottom recording sheet
- Keyboard overlay (`?`) with retro styling
- Tooltips on icon-only controls
- Recording consent + session health panel (Plan 13 Phase 2 preview)

### Phase E — Trust through data UI (Plan 13 alignment)

- Timeline component from `RecordingEvent` (mono timestamps, LED event types)
- Upload status: `recording → finalizing → uploading → recoverable → complete`
- Empty / error / loading skeletons matching chassis geometry

### Phase F — Polish pass (`$impeccable polish` + `$impeccable audit`)

- a11y audit on studio + landing
- Concentric radius pass on nested AnalogCard / AnalogInset
- Performance: no `transition: all`; GPU-friendly transforms only

---

## Relationship to engineering plans

```
Plan 13 Phase 0 (trust)     ──┐
Plan 14 (brand shell)       ──┼──► Premium perception
Plan 15 (this doc)          ──┘
Plan 12 (studio UX)         ───► Daily-use quality
Plan 01–04 (features)       ───► Differentiation story on landing
```

**Order recommendation:**

1. Plan 13 Phase 0 (parallel) — without trust, premium UI is lipstick
2. Plan 15 Phase A + B — governance + finish landing
3. Plan 15 Phase C — AppShell (biggest “app vs marketing” gap)
4. Plan 12 + 15 Phase D — studio
5. Plan 15 Phase E when `RecordingEvent` API is stable

---

## Component system targets (single vocabulary)

| Layer            | Location                                                  | Notes                                 |
| ---------------- | --------------------------------------------------------- | ------------------------------------- |
| Tokens           | `packages/ui/src/styles/globals.css`                      | Warm OKLCH, LED vars, easings         |
| Primitives       | `retro-primitives`, `analog-card`, `led`, `analog-reveal` |                                       |
| Marketing layout | `components/layout/*`, `marketing/landing-page`           | Brand register                        |
| App layout       | `components/layout/app-shell` (new)                       | Product register                      |
| Patterns         | `components/patterns/*` (new, optional)                   | Timeline, signal strip, session meter |

---

## Success metrics (qualitative)

- Landing passes **brand slop test**: identifiable without logo as “studio hardware” not “AI SaaS”
- Dashboard passes **product slop test**: familiar to Riverside/Descript users, not alien
- One accent color story across all surfaces
- Every critical workflow has designed loading / empty / error states

---

## First PR after this plan

**Recommended:** Phase A + Phase B slice

1. Add `PRODUCT.md` + `DESIGN.md`
2. Landing: pricing + trust + copy pass + theme toggle
3. Mark Plan 14 `done`, Plan 15 Phase A–B `in-progress`

No new mockup themes until Retro Analog v2 scores well on the craft checklist above.

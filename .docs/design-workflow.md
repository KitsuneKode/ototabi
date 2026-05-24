# Design workflow (how to work on Ototabi UI)

Use this with `PRODUCT.md`, `DESIGN.md`, and `.plans/15-premium-ux-master-plan.md`.

## Before you design (answer these)

### 1. Product intent (5 min)

| Question                   | Your answer should be specific                     |
| -------------------------- | -------------------------------------------------- |
| Who is on this screen?     | e.g. host 10 min before a guest joins, not "users" |
| What is the one verb?      | e.g. "start recording", not "use the dashboard"    |
| What must they trust here? | e.g. upload progress, not "the brand"              |
| Brand or product register? | Marketing page vs authenticated app                |
| What is the failure state? | Empty, error, loading, offline                     |

### 2. Visual intent (one sentence)

Template: _"[Who] in [place/light], doing [verb], should feel [adjective]."_

Example: _Host in a dim room starting a session should feel calm, precise, and professional — like hardware, not a startup landing._

If the sentence does not force dark/light or dense/airy, rewrite it.

### 3. Design decisions (must explain why)

- Why this layout?
- Why this color (and why not amber everywhere)?
- Why this typeface role (display vs body vs mono)?
- What is the **signature** element on this screen?

If the answer is "it's clean" or "it's common", you are defaulting.

## While building

1. **Tokens only** — `bg-background`, `text-foreground`, `text-accent`, `text-subtle-foreground`. No random hex in components.
2. **Reuse shell** — `ProductShell` / `SiteHeader` / `SiteFooter` (brand), `AppShell` (product, when added).
3. **Reuse primitives** — `AnalogCard`, `AnalogInset`, `MechButton`, `MonoLabel`, `PanelTitle`.
4. **One PR per surface** — landing polish, then AppShell, then studio, not everything at once.
5. **Check craft** before merge:
   - Amber only on signal (REC, primary CTA, focus)
   - No Oswald on paragraphs
   - No mono on FAQ/body copy
   - Footer / nav use `text-subtle-foreground`
   - `focus-visible` on interactives

## After shipping a slice

- Run `bun fmt`, `bun lint`, `bun typecheck`
- Update plan status in `.plans/README.md`
- Optionally save patterns to `.interface-design/system.md`

## Priority queue (current)

| Order | Work                                    | Plan            |
| ----- | --------------------------------------- | --------------- |
| 1     | Recording trust (auth, uploads, events) | 13 Phase 0      |
| 2     | Landing: pricing + CRT meter + copy     | 14 / 15 Phase B |
| 3     | `AppShell` + dashboard                  | 15 Phase C      |
| 4     | Studio mobile + shortcuts               | 12              |
| 5     | Session timeline UI                     | 15 Phase E      |

Do not add new `/mockups` themes to production. Retro Analog / Studio Console only.

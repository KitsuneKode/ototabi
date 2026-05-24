# Plan 14: Retro Analog v2 — Product Shell & Premium Marketing

**Status:** done  
**Priority:** P1

## Problem

Engineering plans (01–13) focus on recording reliability and features, but the user-facing product still feels like an internal tool:

- Landing page is thin (hero + 3 cards, no workflow story, pricing, or trust).
- No shared layout shell — each page reimplements header, noise, and footer differently.
- Design tokens drifted from the Retro Analog spec (`accent` reads as neutral gray; LEDs and CTAs lack signal color).
- Mockups (`/mockups`) explore alternate aesthetics but are not consolidated into the product system.
- Plan 12 (UX polish) is P2 while polish is blocking perceived quality for creators evaluating the product.

## Solution

### Retro Analog v2 (design system)

- Restore warm chassis palette (beige light / charcoal dark) with a single amber signal accent.
- Document v2 primitives in `.docs/encyclopedia.md`: shell, section rhythm, bento patterns, motion rules.
- Enforce semantic tokens only; LED colors stay dedicated (`--color-led-*`).

### Product shell (all public + auth surfaces)

| Primitive      | Role                                           |
| -------------- | ---------------------------------------------- |
| `ProductShell` | Noise overlay, min height, max width container |
| `SiteHeader`   | Brand, nav, LED strip, mobile sheet menu       |
| `SiteFooter`   | Links, system status LED, copyright            |
| `AuthShell`    | Centered chassis card for sign-in / sign-up    |

### Premium landing (AIDA, retro analog)

1. **Attention** — Split hero: headline (max 2 lines), dual CTA, device mock with CRT inset.
2. **Interest** — Signal strip (tabular metrics), how-it-works timeline, asymmetric feature bento.
3. **Desire** — Differentiators vs stream-only tools, FAQ accordion.
4. **Action** — Final CTA band + footer.

### Default experience

- `defaultTheme="dark"` for studio/product pages (system override still available).
- Staggered enter via CSS (`@starting-style` / utility classes), never `scale(0)`.
- `min-h-[100dvh]` on full-height sections.

## Files to Create

- `apps/client/components/layout/product-shell.tsx`
- `apps/client/components/layout/site-header.tsx`
- `apps/client/components/layout/site-footer.tsx`
- `apps/client/components/layout/auth-shell.tsx`
- `apps/client/components/marketing/landing-page.tsx`

## Files to Change

- `packages/ui/src/styles/globals.css` — warm palette + amber accent
- `apps/client/app/page.tsx` — render `LandingPage`
- `apps/client/app/auth/signin/page.tsx` — `AuthShell`
- `apps/client/app/auth/signup/page.tsx` — `AuthShell`
- `apps/client/components/providers.tsx` — default dark theme
- `.docs/encyclopedia.md` — Retro Analog v2 section
- `.plans/README.md` — register plans 13–14

## Relationship to Other Plans

| Plan | Relationship                                                 |
| ---- | ------------------------------------------------------------ |
| 12   | Subsumed partially: focus rings, motion — apply in shell     |
| 13   | Phase 0 reliability still P0; this plan is parallel UX track |
| 11   | Shell components live under `apps/client/components/layout`  |

## Acceptance Criteria

- Landing has hero, workflow, bento features, FAQ, and footer CTA.
- Sign-in and sign-up use the same header/footer shell as marketing.
- Amber accent visible on LEDs, badges, and primary CTAs in dark mode.
- `bun fmt`, `bun lint`, `bun typecheck` pass.
- No inline components inside page files (extracted to layout/marketing modules).

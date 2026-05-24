# Ototabi — Design System (Retro Analog v2)

## Direction

**Retro Analog v2:** Physical rack gear — chassis, inset CRT displays, tally LEDs, mechanical buttons. Warm charcoal (dark) and aged beige (light). Single **amber signal** accent.

## Color strategy

| Register        | Strategy                 | Accent use                                                              |
| --------------- | ------------------------ | ----------------------------------------------------------------------- |
| Brand (landing) | Committed but controlled | Amber only for REC tally, primary CTA, focus — not body text or metrics |
| Product (app)   | Restrained               | Primary actions, recording state, alerts only                           |

**Premium dark palette:** Low-chroma charcoal background (`oklch ~0.12`), soft `border` at ~9% white, `--subtle-foreground` for footer/nav. Avoid muddy brown or glowing orange everywhere (reads informal).

### Primitives (semantic — use in components)

- `--background`, `--card`, `--popover` — surface elevation
- `--foreground`, `--muted-foreground` — text hierarchy (add tertiary tokens in Phase C)
- `--accent` — amber signal (never decorative gray)
- `--color-led-on`, `--color-led-green`, `--color-accent-glow` — hardware indicators

### Banned

- Pure `#000` / `#fff` (use OKLCH warm neutrals)
- Purple / blue SaaS gradients
- Glassmorphism as default
- Multiple competing accent hues

## Typography

Three roles — never use display or mono for long paragraphs.

| Role           | Family        | CSS variable     | Usage                                                     |
| -------------- | ------------- | ---------------- | --------------------------------------------------------- |
| Display        | Oswald        | `--font-display` | `h1`–`h4`, `.font-display`, `MechButton`, brand wordmark  |
| Body           | Source Sans 3 | `--font-sans`    | Paragraphs, FAQ answers, footer blurb, form helper text   |
| Data / screens | Courier Prime | `--font-mono`    | `MonoLabel`, metrics, REC, nav labels, inputs, timestamps |

**Rules**

- Default `body` = Source Sans 3 (`font-sans`).
- Uppercase chassis copy = Oswald (`font-display`) or mono labels (`MonoLabel`), not both on the same line.
- Mono = short technical strings only, not multi-sentence copy.

Scale: product UI uses fixed rem steps (1.125–1.25 ratio). Headings use `text-balance`; body uses `text-pretty`.

## Depth

**Borders-first + chassis shadow.** Inset panels (`AnalogInset`) darker than card. Dropdowns one elevation above parent. Inputs slightly darker than surface (inset affordance).

No glass blur panels. Shadows subtle; tinted to warm hue.

## Spacing

Base unit **4px**. Section rhythm on marketing: `py-20 md:py-28`. Card padding: `p-6` / `p-8`. Concentric radius: outer = inner + padding.

## Motion

| Context            | Rule                                                                |
| ------------------ | ------------------------------------------------------------------- |
| Button press       | `translateY(2px)` + `scale(0.96–0.97)`, `--ease-mechanical`, ~150ms |
| UI enter           | `scale(0.96)` + opacity, `--ease-out`, 200–400ms                    |
| Marketing stagger  | `.analog-enter` delays 80–400ms; not on app load                    |
| Studio / dashboard | No orchestrated page entrance                                       |

Respect `prefers-reduced-motion`.

## Signature

**REC tally + CRT inset** — scanlined display, amber REC label, channel strip metaphor in hero and studio preflight.

## Components (source of truth)

| Component                                                | Path                                             |
| -------------------------------------------------------- | ------------------------------------------------ |
| AnalogCard / AnalogInset                                 | `apps/client/components/ui/analog-card.tsx`      |
| Led, MechButton, MonoLabel, StatusBadge, NoiseBackground | `apps/client/components/ui/retro-primitives.tsx` |
| AnalogReveal                                             | `apps/client/components/ui/analog-reveal.tsx`    |
| ProductShell, SiteHeader, SiteFooter, AuthShell          | `apps/client/components/layout/`                 |
| Tokens + utilities                                       | `packages/ui/src/styles/globals.css`             |

## Layout patterns

- **Marketing:** `ProductShell` + `SiteHeader` + chapter sections + `SiteFooter`
- **App (target):** `AppShell` — nav same background as canvas, border separation only
- **Auth:** `AuthShell` centered chassis card

## Impeccable absolute bans (enforce in review)

- Side-stripe accent borders on cards
- Gradient text (`background-clip: text`)
- Glassmorphism as default
- Hero-metric template as primary pattern
- Identical icon-card grids without bento intent
- Em dashes in copy

## References

- `.docs/encyclopedia.md` — domain terms
- `.plans/14-retro-analog-v2-product-shell.md` — implementation scope
- `.plans/15-premium-ux-master-plan.md` — phased UX rollout

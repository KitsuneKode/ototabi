# Ototabi Studio — Brand Kit

Visual identity for marketing and product chrome. Aligns with [Retro Analog v2](encyclopedia.md#retro-analog-v2-product-shell) and `PRODUCT.md` tone: warm, mechanical, serious.

## Strategy

| Field    | Direction                                                               |
| -------- | ----------------------------------------------------------------------- |
| Category | Browser remote recording + AI post-production                           |
| Audience | Podcast hosts, small creator teams, self-host operators                 |
| Promise  | Local masters per guest, crash-safe capture, synced export              |
| Metaphor | Tape reel + SYNC LED + chassis housing (studio hardware)                |
| Avoid    | Purple SaaS gradients, glass aurora, generic mic icons, Riverside clone |

## Logo

**Mark:** Circular tape-reel monogram (letter **O**) with concentric groove rings, subtle waveform cut, amber **SYNC** LED at ~2 o'clock, outer rounded chassis frame with top highlight bevel.

**Wordmark:** **OTOTABI** — Oswald, bold, uppercase, tight tracking.

**Lockup:** Mark + wordmark + optional mono subtitle (`Studio Console`, `Model 16-A`, etc.).

### Implementation

| Asset                         | Path                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| React mark + lockup           | [`apps/client/components/brand/ototabi-logo.tsx`](../apps/client/components/brand/ototabi-logo.tsx)                       |
| SVG mark (static)             | [`apps/client/public/brand/ototabi-mark.svg`](../apps/client/public/brand/ototabi-mark.svg)                               |
| App icon (Next)               | [`apps/client/app/icon.svg`](../apps/client/app/icon.svg)                                                                 |
| AI reference — full 3×3 board | [`.docs/assets/ototabi-brandkit-3x3.png`](assets/ototabi-brandkit-3x3.png)                                                |
| AI reference — mark only      | [`apps/client/public/brand/ototabi-logo-mark-reference.png`](../apps/client/public/brand/ototabi-logo-mark-reference.png) |

### Social & marketing raster

Generated with **brandkit** direction (Retro Analog studio console, tape-reel O, amber SYNC LED). Resized to platform specs; SVG mark remains UI source of truth.

| Asset       | Path                                                                              | Dimensions | Use                                     |
| ----------- | --------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| Open Graph  | [`apps/client/public/brand/og.png`](../apps/client/public/brand/og.png)           | 1200 × 630 | `openGraph.images` in root `layout.tsx` |
| Twitter / X | [`apps/client/public/brand/twitter.png`](../apps/client/public/brand/twitter.png) | 1200 × 600 | `twitter.images` in root `layout.tsx`   |
| Wide banner | [`apps/client/public/brand/banner.png`](../apps/client/public/brand/banner.png)   | 1920 × 480 | Docs headers, marketing, GitHub social  |

Crawlers resolve image URLs via `metadataBase` (`NEXT_PUBLIC_APP_URL`). After deploy, re-scrape links in [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or X Card Validator if previews look stale.

```tsx
import { OtotabiLogoLockup, OtotabiLogoMark } from "@/components/brand/ototabi-logo";

<OtotabiLogoLockup href="/dashboard" subtitle="Studio Console" />
<OtotabiLogoMark className="h-8 w-8" />
```

## Color

Use design tokens from [`packages/ui/src/styles/globals.css`](../packages/ui/src/styles/globals.css) — do not invent parallel palettes.

| Role       | Token / use                                                       |
| ---------- | ----------------------------------------------------------------- |
| Base       | `--background`, charcoal chassis                                  |
| Accent     | `--accent` — amber broadcast signal (REC, active nav, focus ring) |
| Text       | `--foreground`, `--muted-foreground`                              |
| OK         | `--color-led-on` green (sparingly)                                |
| Warn / REC | LED red + amber pulse                                             |
| Borders    | `--border`, inset panels                                          |

## Typography

| Role            | Font                        |
| --------------- | --------------------------- |
| Display / brand | Oswald (`font-display`)     |
| Body            | Source Sans 3               |
| Data / labels   | Courier Prime (`font-mono`) |

## Taglines (approved)

- **LOCAL MASTERS. SYNCED.** — hero / brand board
- **Model 16-A // Local-First Remote Recording** — marketing sub-label
- **Studio Console** — authenticated app shell

## Voice

- Short, uppercase labels for structure
- Monospace for status, timecodes, track IDs
- No buzzword soup; explain reliability and alignment

## Reels presets (Batch 6)

After a clip’s base 9:16 render is `ready`, use **Reels preset** buttons (`bold-captions`, `minimal-lower-third`) on recordings/export. Worker burns clip rationale as caption via ffmpeg `drawtext` + `textfile`.

## Applications

- **Marketing:** `SiteHeader` lockup + PWR/SYNC LEDs
- **Product:** `AppShell` sidebar lockup; favicon from `app/icon.svg`
- **Social / SEO:** `og.png`, `twitter.png` wired in [`apps/client/app/layout.tsx`](../apps/client/app/layout.tsx); optional `banner.png` for static pages
- **Export / recovery UI:** reuse mark at small sizes (≥24px)

## Regenerating art

Brand-kit boards were generated with the Cursor **brandkit** skill (3×3 deck + square mark reference). Re-run with the same strategy block in `.docs/brand.md` if refreshing photography-style panels; keep the SVG mark as source of truth for UI.

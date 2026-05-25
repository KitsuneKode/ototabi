# Ototabi — Product Context

## Product purpose

Browser-based remote recording for podcasters and creator teams. Each participant records high-quality local tracks; the platform aligns, uploads, and supports post-production (transcripts, clips, export).

## Register

- **Brand:** Marketing and public pages (`/`, pricing, demo, about).
- **Product:** Authenticated app (dashboard, studio, recordings, export, recovery, settings).

## Primary users

1. **Solo host / bootstrap podcaster** — Needs trustworthy recording without a producer; often records from home with variable network.
2. **Small creator team** — Host plus remote guests; cares about separate tracks and fast turnaround.
3. **Self-host operator** — Wants ownership, private media, MinIO/Postgres/LiveKit on their stack.

## Jobs to be done

- Invite guests and start a session quickly.
- See recording and upload health during and after the session.
- Recover from tab crash or weak network without losing masters.
- Review sessions and export aligned multi-track assets.
- Generate editable AI artifacts (transcripts, chapters, show notes, magic clips).

## Creator suite roadmap (staged)

| Stage                        | Shipped / in progress                                                | Notes                                       |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| **Now — Recording producer** | Trust studio, dashboard, recovery, private uploads                   | Riverside-class reliability without hosting |
| **Next — AI surface**        | Transcript hardening, show notes, clip candidates, 9:16 export queue | Hybrid WASM + Railway worker                |
| **Shipped — Demo mode**      | Browser screen capture, cursor log, manual zoom editor               | `.plans/24-demo-mode-browser.md`            |
| **Later — Reels presets**    | Native JSON packs in repo (Plan 20 batch 6)                          | After magic clips engine                    |

## Tone

Warm, mechanical, serious. Vintage studio equipment — not playful toy, not cold fintech, not neon retrowave.

## Anti-references

- Generic SaaS landing (purple gradients, glass cards, three identical feature cards).
- Riverside visual clone (same layout, different logo).
- AI slop: Inter/Space Grotesk, hero-metric template, gradient text, editorial magazine landing on a tool product.
- Mockup directions at `/mockups` that are not Retro Analog (glass aurora, synth vapor, etc.) — exploratory only.

## Strategic principles

1. **Reliability before novelty** (Plan 13).
2. **Private media by default.**
3. **Local capture quality + server truth for permissions and state.**
4. **AI output must be editable and explainable.**

## Differentiation (market)

Not a cheaper Riverside clone — an **AI-native recording producer** with self-host option and crash-safe local masters.

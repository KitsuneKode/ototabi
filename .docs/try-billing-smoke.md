# Billing & plan gates — local smoke

Run after [quick-start.md](./quick-start.md) infra + `bun dev`. For **real** gate behavior, set `DODO_PAYMENTS_API_KEY` (and related Dodo env) so `shouldBypassPlanGates()` is false.

## Prerequisites

| Check         | Detail                                                             |
| ------------- | ------------------------------------------------------------------ |
| API + worker  | `bun dev`                                                          |
| Dodo optional | Without Dodo, all authenticated users bypass plan middleware (dev) |
| Test user     | Trial account (no paid sub) and optionally Creator / Pro test subs |

## 1. Trial transcript teaser

1. Sign in as **Trial** user (no active paid subscription).
2. Open `/recordings/{sessionId}` after a short completed session.
3. **Expect:** transcript may show limited/teaser UX or Pro-gated actions disabled (per product wiring).
4. Call **retry transcript** / schedule transcript as Trial → **403** with message from `planGateError("PRO")` when Dodo configured.

## 2. Session cap (Trial — not implemented yet)

**Wave 1:** fourth recording in a rolling window should fail with usage error.

Until then, document as **N/A** — only verify counter does not exist in UI.

## 3. Clip cap (Creator — not implemented yet)

**Wave 1:** Creator tier — 11th clip in calendar month should 403.

Until usage module ships, verify **clips regen** requires Creator+:

1. Trial user → **Regenerate clips** → **403** (`CREATOR` minimum).
2. Creator user → succeeds (subject to future monthly cap).

## 4. Pro cut / text-edit UI gate

1. Open `/export/{sessionId}` as **Trial**.
2. **Expect (Wave 1 target):** browser FFmpeg cut controls hidden or disabled; upgrade CTA.
3. As **Pro**, cut concat controls available (client-side today).

## 5. Policy unit tests (CI parity)

```bash
bun run test --filter=@ototabi/billing
```

All `plan-policy` tests pass (rank, `resolveEffectivePlan`, `satisfiesMinimumPlan`, `planGateError`).

## Sign-off

- [ ] Trial blocked from Pro procedures when Dodo on
- [ ] Creator+ clips path allowed when subscribed
- [ ] Handoff updated in [subagent-handoff.md](./subagent-handoff.md)

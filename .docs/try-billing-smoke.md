# Billing & plan gates — local smoke

Run after [quick-start.md](./quick-start.md) infra + `bun dev`. For **real** gate behavior, set `DODO_PAYMENTS_API_KEY` (and related Dodo env) so `shouldBypassPlanGates()` is false.

## Prerequisites

| Check         | Detail                                                             |
| ------------- | ------------------------------------------------------------------ |
| API + worker  | `bun dev`                                                          |
| Dodo optional | Without Dodo, all authenticated users bypass plan middleware (dev) |
| Test user     | Trial account (no paid sub) and optionally Creator / Pro test subs |
| DB migrated   | `bun run db:migrate` includes `usage_counter` table                |

## 1. Trial transcript teaser

1. Sign in as **Trial** user (no active paid subscription).
2. Complete a short studio session and stop recording.
3. **Expect:** first session queues Whisper (`transcriptStatus` → processing); `usage_counter` row `TRANSCRIPT_LIFETIME` count = 1 for host.
4. Complete a **second** session (or retry transcript on another session).
5. **Expect:** `scheduleTranscript` / retry returns `plan_upgrade_required` when Dodo configured; no second queue job.

## 2. Session cap (Trial)

1. As **Trial** host, complete **3** studio sessions (`status = COMPLETED`).
2. Start a **fourth** recording in the same room.
3. **Expect:** `rooms.startRecordingSession` → **403** with session cap message.

## 3. Clip cap (Creator)

1. As **Creator** (not Pro), perform clip operations (regenerate and/or queue renders) until monthly counter reaches 10.
2. Attempt an **11th** operation in the same UTC month.
3. **Expect:** **403** with clip cap message.

Also verify **clips regen** requires Creator+:

1. Trial user → **Regenerate clips** → **403** (`CREATOR` minimum via `creatorProcedure`).
2. Creator user → succeeds until monthly cap.

## 4. Pro cut / text-edit UI gate

1. Open `/export/{sessionId}` as **Trial** or **Creator** (below Pro).
2. **Expect:** transcript cut UI disabled (reduced opacity); **Upgrade to Pro** CTA visible.
3. As **Pro**, cut controls enabled; `usage.get` → `features.textBasedEditing: true`.

## 5. Policy unit tests (CI parity)

```bash
bun run test --filter=@ototabi/trpc
bun run test --filter=@ototabi/billing
```

- `usage.policy.test.ts` — session cap, clip cap, transcript teaser
- `schedule-transcript.gates.test.ts` — `evaluateTranscriptPlanGate`
- `plan-policy.test.ts` — rank, `resolveEffectivePlan`, `satisfiesMinimumPlan`

## Sign-off

- [ ] Trial: 1 lifetime transcript, 3 session cap when Dodo on
- [ ] Creator: 10 clip ops/month when Dodo on
- [ ] Export page disables cut mode below Pro
- [ ] Handoff updated in [subagent-handoff.md](./subagent-handoff.md)

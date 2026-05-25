# Plan 08: Billing — Dodo Payments Subscriptions

**Status:** pending  
**Priority:** P2  
**Provider target:** [Dodo Payments](https://docs.dodopayments.com) (replace existing Polar scaffolding in `packages/billing`).

## Problem

The product has no revenue mechanism. AI features (Whisper, LLM) cost money to run. Must gate expensive features behind paid plans.

## Solution

Dodo Payments Checkout Sessions for subscription management. Plans: Trial (14 days, free) → Creator ($15/mo) → Pro ($29/mo) → Studio ($59/mo).

**Migration note:** Repo currently wires Polar (`packages/billing`, `/api/polar-webhook`). Plan 08 implementation should swap to `DODO_PAYMENTS_API_KEY`, checkout session create, and Dodo webhooks for `Subscription` sync.

### Plan Gating

| Feature               | Trial      | Creator   | Pro       | Studio    |
| --------------------- | ---------- | --------- | --------- | --------- |
| Local recording       | 3 sessions | Unlimited | Unlimited | Unlimited |
| Export quality        | 720p       | 1080p     | 4K        | 4K        |
| AI clips / month      | 0          | 10        | Unlimited | Unlimited |
| Text-based editing    | ✗          | ✗         | ✓         | ✓         |
| Transcript + chapters | ✗          | ✗         | ✓         | ✓         |
| Noise reduction       | ✗          | ✓         | ✓         | ✓         |
| Custom watermark      | ✗          | ✗         | ✗         | ✓         |
| Team seats            | ✗          | ✗         | ✗         | 5         |
| S3 BYO                | ✗          | ✗         | ✗         | ✓         |

### Database

```prisma
enum Plan { TRIAL CREATOR PRO STUDIO }
enum SubscriptionStatus { TRIALING ACTIVE PAST_DUE CANCELED EXPIRED }

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  plan                 Plan               @default(TRIAL)
  status               SubscriptionStatus @default(TRIALING)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Plan Gating Middleware

```ts
const requirePlan = (minimum: Plan) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const sub = await prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!sub || PLAN_ORDER[sub.plan] < PLAN_ORDER[minimum])
      throw new TRPCError({ code: "FORBIDDEN", message: "Plan upgrade required" });
    return next();
  });
```

## Files to Create

- `packages/stripe/` — Stripe client, webhook handler, checkout session factory
- Migration: `Subscription` table

## Files to Change

- `packages/trpc/src/trpc.ts` — `requirePlan` middleware
- `apps/client/app/settings/page.tsx` — billing section
- New page: `apps/client/app/settings/billing/page.tsx`

## Acceptance Criteria

- Stripe Checkout creates subscription
- Webhook updates `Subscription` model on payment events
- AI endpoints return 403 for insufficient plan
- Trial ends after 14 days, plan downgrades

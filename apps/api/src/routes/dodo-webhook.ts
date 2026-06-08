import { Webhooks } from "@dodopayments/express";
import { handleDodoWebhook } from "@ototabi/billing/webhook";
import { Router } from "express";

const dodoWebhookRouter = Router();

const webhookSecret = process.env.DODO_WEBHOOK_SECRET?.trim();

if (webhookSecret) {
  dodoWebhookRouter.post(
    "/",
    Webhooks({
      webhookKey: webhookSecret,
      onPayload: async (payload) => {
        await handleDodoWebhook(payload as Parameters<typeof handleDodoWebhook>[0]);
      },
    }),
  );
} else {
  dodoWebhookRouter.post("/", (_req, res) => {
    res.status(503).json({ error: "Billing webhooks are not configured" });
  });
}

export default dodoWebhookRouter;

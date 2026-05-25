import { Webhooks } from "@dodopayments/express";
import { handleDodoWebhook } from "billing/webhook";
import { Router } from "express";

const dodoWebhookRouter = Router();

dodoWebhookRouter.post(
  "/",
  Webhooks({
    webhookKey: process.env.DODO_WEBHOOK_SECRET ?? "",
    onPayload: async (payload) => {
      await handleDodoWebhook(payload as Parameters<typeof handleDodoWebhook>[0]);
    },
  }),
);

export default dodoWebhookRouter;

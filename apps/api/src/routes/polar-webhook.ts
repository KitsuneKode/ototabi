import { handlePolarWebhook } from "billing/webhook";
import { Router, type Request, type Response } from "express";

import { asyncHandler } from "@/middlewares/async-handler-middleware";

const polarWebhookRouter = Router();

polarWebhookRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const event = req.body;
      await handlePolarWebhook(event);
      return res.json({ received: true });
    } catch (error) {
      console.error("[Polar] Webhook error:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }),
);

export default polarWebhookRouter;

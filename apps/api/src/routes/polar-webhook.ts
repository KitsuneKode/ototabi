import { handlePolarWebhook } from "billing/webhook";
import { Router, type Request, type Response } from "express";

const polarWebhookRouter = Router();

polarWebhookRouter.post("/", async (req: Request, res: Response) => {
  try {
    const event = req.body;
    await handlePolarWebhook(event);
    return res.json({ received: true });
  } catch (error) {
    console.error("[Polar] Webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default polarWebhookRouter;

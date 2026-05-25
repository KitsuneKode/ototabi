import { createGuestSession } from "@ototabi/auth/guest-session";
import { Router, type Request, type Response } from "express";

import { asyncHandler } from "@/middlewares/async-handler-middleware";

const guestAuthRouter = Router();

guestAuthRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name } = req.body as { name?: string };
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required" });
      }

      const guest = await createGuestSession({
        name,
        requestHeaders: req.headers,
        setCookies: res,
      });

      return res.json(guest);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("50 characters")) {
        return res.status(400).json({ error: message });
      }
      console.error("[GuestAuth] Failed to create guest session:", error);
      return res.status(500).json({ error: "Failed to create guest session" });
    }
  }),
);

export default guestAuthRouter;

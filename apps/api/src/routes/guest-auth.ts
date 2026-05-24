import { prisma } from "@ototabi/store";
import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";

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
      if (name.length > 50) {
        return res.status(400).json({ error: "Name must be 50 characters or less" });
      }

      const userId = crypto.randomUUID();
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const now = new Date();

      await prisma.user.create({
        data: {
          id: userId,
          name: name.trim(),
          email: `guest-${userId.slice(0, 8)}@guest.ototabi.local`,
          emailVerified: true,
          role: "guest",
          createdAt: now,
          updatedAt: now,
        },
      });

      await prisma.session.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        },
      });

      res.cookie("better-auth.session_token", sessionToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ id: userId, name: name.trim(), role: "guest" });
    } catch (error) {
      console.error("[GuestAuth] Failed to create guest session:", error);
      return res.status(500).json({ error: "Failed to create guest session" });
    }
  }),
);

export default guestAuthRouter;

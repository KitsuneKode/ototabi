import { auth } from "@ototabi/auth/server";
import { enterStudioForLiveKit, StudioAccessError } from "@ototabi/trpc/enter-studio";
import { Router, type Request, type Response } from "express";
import { AccessToken } from "livekit-server-sdk";

import { asyncHandler } from "@/middlewares/async-handler-middleware";
import config from "@/utils/config";

const liveKitAuthRouter = Router();

function accessErrorToStatus(code: StudioAccessError["code"]): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "FORBIDDEN":
      return 403;
    default:
      return 400;
  }
}

liveKitAuthRouter.get(
  "/token",
  asyncHandler(async (req: Request, res: Response) => {
    const room = req.query.room as string;
    const username = req.query.username as string;
    const inviteToken = req.query.invite as string | undefined;
    if (!room) {
      return res.status(400).json({ error: 'Missing "room" query parameter' });
    }
    if (!username) {
      return res.status(400).json({ error: 'Missing "username" query parameter' });
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { roomId, participantRole } = await enterStudioForLiveKit({
        userId: session.user.id,
        roomCode: room,
        inviteToken,
      });

      const apiKey = config.getConfig("liveKitApiKey");
      const apiSecret = config.getConfig("liveKitApiSecret");
      const wsUrl = config.getConfig("liveKitUrl");

      if (!apiKey || !apiSecret || !wsUrl) {
        return res.status(500).json({ error: "Server misconfigured" });
      }

      const at = new AccessToken(apiKey, apiSecret, {
        identity: session.user.id,
        name: username,
        metadata: JSON.stringify({ role: participantRole, roomId }),
        ttl: "1h",
      });
      at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

      return res
        .status(200)
        .header("Cache-Control", "no-store")
        .json({ token: await at.toJwt() });
    } catch (err) {
      if (err instanceof StudioAccessError) {
        return res.status(accessErrorToStatus(err.code)).json({ error: err.message });
      }
      throw err;
    }
  }),
);

export default liveKitAuthRouter;

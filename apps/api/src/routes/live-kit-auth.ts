import { auth } from "@ototabi/auth/server";
import { prisma } from "@ototabi/store";
import { Router, type Request, type Response } from "express";
import { AccessToken } from "livekit-server-sdk";
import crypto from "node:crypto";

import { asyncHandler } from "@/middlewares/async-handler-middleware";
import config from "@/utils/config";

const liveKitAuthRouter = Router();

function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

liveKitAuthRouter.get(
  "/token",
  asyncHandler(async (req: Request, res: Response) => {
    const room = req.query.room as string;
    const username = req.query.username as string;
    const inviteToken = req.query.invite as string | undefined;
    if (!room) {
      return res.status(400).json({ error: 'Missing "room" query parameter' });
    } else if (!username) {
      return res.status(400).json({ error: 'Missing "username" query parameter' });
    }

    // Verify caller is authenticated
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const roomRecord = await prisma.room.findUnique({
      where: { code: room },
      select: {
        id: true,
        creatorId: true,
        invites: {
          where: { tokenHash: inviteToken ? hashInviteToken(inviteToken) : "" },
          select: { revokedAt: true, expiresAt: true, maxUses: true, usedCount: true },
          take: 1,
        },
        members: { where: { userId: session.user.id }, select: { role: true }, take: 1 },
        participants: { where: { userId: session.user.id }, select: { userId: true }, take: 1 },
      },
    });

    if (!roomRecord) {
      return res.status(404).json({ error: "Room not found" });
    }

    const invite = inviteToken ? roomRecord.invites[0] : null;
    const inviteUsable =
      !!invite &&
      !invite.revokedAt &&
      (!invite.expiresAt || invite.expiresAt > new Date()) &&
      (invite.maxUses === null || invite.usedCount < invite.maxUses);
    const hasRoomAccess =
      roomRecord.creatorId === session.user.id ||
      roomRecord.members.length > 0 ||
      roomRecord.participants.length > 0 ||
      inviteUsable;

    if (!hasRoomAccess) {
      return res.status(403).json({ error: "Room access denied" });
    }

    const participantRole =
      roomRecord.creatorId === session.user.id
        ? "host"
        : (roomRecord.members[0]?.role ?? "participant");

    const apiKey = config.getConfig("liveKitApiKey");
    const apiSecret = config.getConfig("liveKitApiSecret");
    const wsUrl = config.getConfig("liveKitUrl");

    if (!apiKey || !apiSecret || !wsUrl) {
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: username,
      metadata: JSON.stringify({ role: participantRole, roomId: roomRecord.id }),
      ttl: "1h",
    });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    return res
      .status(200)
      .header("Cache-Control", "no-store")
      .json({ token: await at.toJwt() });
  }),
);

export default liveKitAuthRouter;

import { prisma } from "@ototabi/store";

import { USAGE_KIND, clipsMonthPeriodKey, type UsageKind } from "./usage.policy";

export const usageRepository = {
  async getCount(userId: string, kind: UsageKind, periodKey = ""): Promise<number> {
    const row = await prisma.usageCounter.findUnique({
      where: {
        userId_kind_periodKey: { userId, kind, periodKey },
      },
      select: { count: true },
    });
    return row?.count ?? 0;
  },

  async increment(userId: string, kind: UsageKind, periodKey = "", delta = 1): Promise<number> {
    const row = await prisma.usageCounter.upsert({
      where: {
        userId_kind_periodKey: { userId, kind, periodKey },
      },
      create: { userId, kind, periodKey, count: delta },
      update: { count: { increment: delta } },
      select: { count: true },
    });
    return row.count;
  },

  async countCompletedStudioSessionsForHost(hostUserId: string): Promise<number> {
    return prisma.recordingSession.count({
      where: {
        status: "COMPLETED",
        mode: "STUDIO",
        room: { creatorId: hostUserId },
      },
    });
  },

  clipsMonthPeriodKey,

  USAGE_KIND,
};

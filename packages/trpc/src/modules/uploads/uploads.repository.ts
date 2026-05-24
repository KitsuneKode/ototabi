import { prisma } from "@ototabi/store";

export const uploadsRepository = {
  async canUserUploadToSession(data: { sessionId: string; userId: string }) {
    const session = await prisma.recordingSession.findFirst({
      where: {
        id: data.sessionId,
        room: {
          OR: [
            { creatorId: data.userId },
            { members: { some: { userId: data.userId } } },
            { participants: { some: { userId: data.userId } } },
          ],
        },
      },
      select: { id: true },
    });
    return !!session;
  },

  async findActiveUpload(data: { sessionId: string; trackSid: string; userId: string }) {
    return prisma.uploadSession.findFirst({
      where: {
        sessionId: data.sessionId,
        trackSid: data.trackSid,
        userId: data.userId,
        status: { in: ["UPLOADING", "FAILED"] },
      },
    });
  },

  async createTrack(data: {
    sessionId: string;
    userId: string;
    trackSid: string;
    type: string;
    s3Key: string;
  }) {
    return prisma.recordingTrack.create({
      data: { ...data, status: "UPLOADING" },
    });
  },

  async createUploadSession(data: {
    sessionId: string;
    userId: string;
    trackSid: string;
    type: string;
    uploadId: string;
    s3Key: string;
  }) {
    return prisma.uploadSession.create({ data });
  },

  async findUploadForUser(data: { userId: string; key: string; uploadId: string }) {
    return prisma.uploadSession.findFirst({
      where: {
        userId: data.userId,
        s3Key: data.key,
        uploadId: data.uploadId,
        status: { in: ["UPLOADING", "FAILED"] },
      },
    });
  },

  async markTrackComplete(s3Key: string, s3Url: string) {
    await prisma.$transaction([
      prisma.recordingTrack.updateMany({
        where: { s3Key: s3Key },
        data: { status: "COMPLETED", s3Url },
      }),
      prisma.uploadSession.updateMany({
        where: { s3Key: s3Key },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
    ]);
  },

  async markUploadFailed(data: { key: string; uploadId: string; userId: string }) {
    return prisma.uploadSession.updateMany({
      where: { s3Key: data.key, uploadId: data.uploadId, userId: data.userId },
      data: { status: "FAILED" },
    });
  },

  async findTrackById(id: string) {
    return prisma.recordingTrack.findUnique({
      where: { id },
      select: { id: true, status: true, s3Url: true, type: true, trackSid: true },
    });
  },

  async findTrackBySid(trackId: string) {
    return prisma.recordingTrack.findUnique({ where: { id: trackId } });
  },

  async resetTrackStatus(trackId: string) {
    return prisma.recordingTrack.update({
      where: { id: trackId },
      data: { status: "UPLOADING" },
    });
  },
};

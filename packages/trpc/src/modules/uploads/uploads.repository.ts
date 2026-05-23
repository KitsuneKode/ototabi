import { prisma } from "@ototabi/store";

export const uploadsRepository = {
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

  async markTrackComplete(s3Key: string, s3Url: string) {
    return prisma.recordingTrack.updateMany({
      where: { s3Key: s3Key },
      data: { status: "COMPLETED", s3Url },
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

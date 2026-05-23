import { transcriptRepository } from "./transcript.repository";

export const transcriptService = {
  async getSegments(sessionId: string) {
    return transcriptRepository.getSegments(sessionId);
  },

  async getChapters(sessionId: string) {
    return transcriptRepository.getChapters(sessionId);
  },

  async getShowNotes(sessionId: string) {
    return transcriptRepository.getShowNotes(sessionId);
  },
};

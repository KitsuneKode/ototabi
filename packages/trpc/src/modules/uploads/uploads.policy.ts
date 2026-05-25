/** Pure upload ownership checks — enforced again in uploads.service. */
export const uploadsPolicy = {
  canActOnUploadSession(upload: { userId: string } | null | undefined, actorId: string): boolean {
    return !!upload && upload.userId === actorId;
  },
};

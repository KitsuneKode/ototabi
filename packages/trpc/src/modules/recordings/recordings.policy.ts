export const recordingsPolicy = {
  canStartOrStopRecording(hasStudioAccess: boolean): boolean {
    return hasStudioAccess;
  },
};

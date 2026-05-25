/** Session review access is enforced in the repository query (single fetch with room OR). */
export const sessionReviewPolicy = {
  canViewSession: (session: { id: string } | null): session is { id: string } => !!session,
};

type DemoSessionAccess = {
  id: string;
  mode: string;
  room: { creatorId: string };
};

export const demoPolicy = {
  isDemoSession: (session: { mode: string }): boolean => session.mode === "DEMO",

  canManageDemoSession: (
    session: DemoSessionAccess | null,
    actorId: string,
  ): session is DemoSessionAccess =>
    !!session && session.mode === "DEMO" && session.room.creatorId === actorId,
};

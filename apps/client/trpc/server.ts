import "server-only"; // <-- ensure this file cannot be imported from the client
import { auth } from "@ototabi/auth/server";
import { prisma as db } from "@ototabi/store";
import { createCaller } from "@ototabi/trpc";
import { headers } from "next/headers";
import { cache } from "react";

import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

export const trpcCaller = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return createCaller({ session, db });
});

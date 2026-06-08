import "server-only";
import { auth } from "@ototabi/auth/server";
import { prisma } from "@ototabi/store";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type ServerSessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

export type ServerAuthSession = {
  user: ServerSessionUser;
};

export async function getServerAuthSession(): Promise<ServerAuthSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      role: dbUser?.role ?? "user",
    },
  };
}

/** Redirects unauthenticated users to sign-in. */
export async function requireAuthSession(): Promise<ServerAuthSession> {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/auth/signin");
  }
  return session;
}

/** Host console routes — signed-in users only, guest sessions redirected home. */
export async function requireHostSession(): Promise<ServerAuthSession> {
  const session = await requireAuthSession();
  if (session.user.role === "guest") {
    redirect("/");
  }
  return session;
}

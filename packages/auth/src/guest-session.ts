import { prisma } from "@ototabi/store";
import crypto from "node:crypto";

import { auth, fromNodeHeaders } from "./index";

export type SetCookieAppender = {
  append(name: "Set-Cookie", value: string): void;
};

export function applyAuthSetCookieHeaders(
  target: SetCookieAppender,
  headers: Headers | null | undefined,
) {
  if (!headers) return;

  const setCookies = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      target.append("Set-Cookie", cookie);
    }
    return;
  }

  const raw = headers.get("set-cookie");
  if (raw) {
    target.append("Set-Cookie", raw);
  }
}

export type GuestSessionResult = {
  id: string;
  name: string;
  role: "guest";
};

/**
 * Creates a Better Auth session (signed cookies) for a one-time guest user.
 * Caller must forward Set-Cookie headers to the HTTP response.
 */
export async function createGuestSession(params: {
  name: string;
  requestHeaders: Record<string, string | string[] | undefined>;
  setCookies: SetCookieAppender;
}): Promise<GuestSessionResult> {
  const trimmed = params.name.trim();
  if (!trimmed) {
    throw new Error("Name is required");
  }
  if (trimmed.length > 50) {
    throw new Error("Name must be 50 characters or less");
  }

  const email = `guest-${crypto.randomUUID().slice(0, 12)}@guest.ototabi.local`;
  const password = crypto.randomBytes(32).toString("hex");

  const signUp = await auth.api.signUpEmail({
    body: {
      name: trimmed,
      email,
      password,
    },
    headers: fromNodeHeaders(params.requestHeaders),
    returnHeaders: true,
  });

  const body = signUp.response as { user?: { id: string; name: string } } | null;
  if (!body?.user) {
    throw new Error("Guest sign-up did not return a user");
  }

  applyAuthSetCookieHeaders(params.setCookies, signUp.headers);

  await prisma.user.update({
    where: { id: body.user.id },
    data: { role: "guest" },
  });

  return {
    id: body.user.id,
    name: body.user.name,
    role: "guest",
  };
}

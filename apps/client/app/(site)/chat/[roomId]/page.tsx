import type { Metadata } from "next";

import { redirect } from "next/navigation";

import StudioClientPage from "./studio-client";

export const metadata: Metadata = {
  title: "Studio",
  description: "Browser-based high-quality audio and video recording studio.",
};

function toQueryString(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
    } else {
      params.set(key, value);
    }
  }
  return params.toString();
}

export default async function StudioPage(props: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ roomId }, searchParams] = await Promise.all([props.params, props.searchParams]);

  if (searchParams.preflight !== "done") {
    const query = toQueryString(searchParams);
    redirect(query ? `/chat/${roomId}/preflight?${query}` : `/chat/${roomId}/preflight`);
  }

  return <StudioClientPage />;
}

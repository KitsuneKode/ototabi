import type { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Room",
  description: "Collaborative recording room for multi-track sessions.",
};

export default async function RoomRedirectPage(props: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await props.params;
  redirect(`/rooms/${roomId}/join`);
}

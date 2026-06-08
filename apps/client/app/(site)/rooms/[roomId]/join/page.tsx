import type { Metadata } from "next";

import RoomJoinClientPage from "./join-client";

export const metadata: Metadata = {
  title: "Join Room",
  description: "Join a collaborative recording session with your invite link.",
};

export default function RoomJoinPage() {
  return <RoomJoinClientPage />;
}

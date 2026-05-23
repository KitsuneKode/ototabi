import { redirect } from "next/navigation";

export default async function RoomRedirectPage(props: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await props.params;
  redirect(`/rooms/${roomId}/join`);
}

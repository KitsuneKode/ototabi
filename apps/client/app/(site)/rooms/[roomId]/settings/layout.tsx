import { requireHostSession } from "@/lib/auth/server-session";

export default async function RoomSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return children;
}

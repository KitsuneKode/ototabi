import { requireHostSession } from "@/lib/auth/server-session";

export default async function DemoEditLayout({ children }: { children: React.ReactNode }) {
  await requireHostSession();
  return children;
}

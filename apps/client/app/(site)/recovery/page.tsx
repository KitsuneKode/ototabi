import type { Metadata } from "next";

import RecoveryClientPage from "./recovery-client";

export const metadata: Metadata = {
  title: "Recovery Console",
  description: "Retry pending local uploads from IndexedDB and OPFS storage.",
};

export default function RecoveryPage() {
  return <RecoveryClientPage />;
}

import type { Metadata } from "next";

import PreflightClientPage from "./preflight-client";

export const metadata: Metadata = {
  title: "Studio Preflight",
  description: "Check browser, storage, and device readiness before joining a studio session.",
};

export default function PreflightPage() {
  return <PreflightClientPage />;
}

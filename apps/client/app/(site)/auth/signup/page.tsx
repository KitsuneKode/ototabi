import type { Metadata } from "next";

import SignUpClientPage from "./signup-client";

export const metadata: Metadata = {
  title: "Register — OtoTabi Studio",
  description: "Create an OtoTabi Studio account to host recording sessions.",
};

export default function SignUpPage() {
  return <SignUpClientPage />;
}

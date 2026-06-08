import type { Metadata } from "next";

import SignInClientPage from "./signin-client";

export const metadata: Metadata = {
  title: "Sign In — OtoTabi Studio",
  description: "Sign in to your OtoTabi Studio account.",
};

export default function SignInPage() {
  return <SignInClientPage />;
}

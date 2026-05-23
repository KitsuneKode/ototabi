import { Polar } from "@polar-sh/sdk";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || "";
const POLAR_SERVER = process.env.POLAR_SERVER || "sandbox";

export const polar = new Polar({
  accessToken: POLAR_ACCESS_TOKEN,
  server: POLAR_SERVER as "sandbox" | "production",
});

export function isPolarConfigured(): boolean {
  return !!POLAR_ACCESS_TOKEN;
}

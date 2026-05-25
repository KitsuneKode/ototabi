import DodoPayments from "dodopayments";

const DODO_PAYMENTS_API_KEY = process.env.DODO_PAYMENTS_API_KEY || "";
const DODO_PAYMENTS_ENVIRONMENT = (process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode") as
  | "test_mode"
  | "live_mode";

export const dodoPayments = new DodoPayments({
  bearerToken: DODO_PAYMENTS_API_KEY,
  environment: DODO_PAYMENTS_ENVIRONMENT,
  webhookKey: process.env.DODO_WEBHOOK_SECRET,
});

export function isDodoConfigured(): boolean {
  return !!DODO_PAYMENTS_API_KEY;
}

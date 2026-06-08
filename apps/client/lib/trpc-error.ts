import { TRPCClientError } from "@trpc/client";

function getTrpcErrorCode(error: unknown): string | undefined {
  if (error instanceof TRPCClientError) {
    return error.data?.code;
  }
  if (!error || typeof error !== "object") return undefined;
  return (error as { data?: { code?: string } }).data?.code;
}

export function isTrpcUnauthorized(error: unknown): boolean {
  if (getTrpcErrorCode(error) === "UNAUTHORIZED") return true;
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof (error as { message?: string }).message === "string"
      ? (error as { message: string }).message
      : "";
  return message.toLowerCase().includes("unauthorized");
}

export function isTrpcForbidden(error: unknown): boolean {
  if (getTrpcErrorCode(error) === "FORBIDDEN") return true;
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof (error as { message?: string }).message === "string"
      ? (error as { message: string }).message
      : "";
  return message.toLowerCase().includes("invite") || message.toLowerCase().includes("forbidden");
}

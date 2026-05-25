const GUEST_EMAIL_SUFFIX = "@guest.ototabi.local";

export function isGuestEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.endsWith(GUEST_EMAIL_SUFFIX) || email.startsWith("guest-");
}

export function formatParticipantLabel(params: {
  name: string;
  email?: string | null;
  isLocalGuest?: boolean;
}): string {
  const guest = params.isLocalGuest ?? isGuestEmail(params.email);
  if (guest) {
    const displayName = params.name?.trim() || "Guest";
    return displayName.startsWith("Guest:") ? displayName : `Guest: ${displayName}`;
  }
  return params.name?.trim() || "Participant";
}

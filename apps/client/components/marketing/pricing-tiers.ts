export const PRICING_TIERS = [
  {
    id: "creator",
    name: "Creator",
    price: "Free",
    period: "during beta",
    description: "Everything you need to run remote sessions and export aligned tracks.",
    features: [
      "Unlimited rooms and participants",
      "Local multi-track capture per guest",
      "Crash recovery and upload resume",
      "Session review and aligned export",
    ],
    cta: "Start recording free",
    href: "/auth/signup",
    highlighted: true,
  },
  {
    id: "self-host",
    name: "Self-Host",
    price: "Your infra",
    period: "no vendor lock-in",
    description: "Run Ototabi on PostgreSQL, MinIO, LiveKit, and Bun workers you control.",
    features: [
      "Private media and scoped S3 keys",
      "Invite links with expiry and revoke",
      "Recording event audit trail",
      "AI post-production when you enable workers",
    ],
    cta: "Read self-host guide",
    href: "/#faq",
    highlighted: false,
  },
] as const;

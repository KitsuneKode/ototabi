import { LegalDocument } from "@/components/marketing/legal-document";

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" updated="May 2026">
      <p>
        Ototabi is provided as a browser-based recording studio. You are responsible for obtaining
        consent from participants before recording, and for complying with applicable laws in your
        jurisdiction.
      </p>
      <p>
        Beta access may change without notice. Features, limits, and pricing may be updated as the
        product matures.
      </p>
      <p>
        You must not use the service to distribute unlawful content or to attempt unauthorized
        access to rooms, uploads, or infrastructure.
      </p>
      <p>
        The software is provided as-is during beta. Operators running self-hosted deployments assume
        responsibility for uptime, backups, and security hardening.
      </p>
    </LegalDocument>
  );
}

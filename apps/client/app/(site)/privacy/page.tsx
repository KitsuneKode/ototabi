import { LegalDocument } from "@/components/marketing/legal-document";

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated="May 2026">
      <p>
        Ototabi records audio and video locally in your browser, then uploads encrypted tracks to
        storage you configure. We do not sell personal data.
      </p>
      <p>
        Account data (name, email) is stored to authenticate hosts and manage rooms. Session
        metadata and recording events are retained for recovery, audit, and export.
      </p>
      <p>
        When you self-host, your infrastructure processes all media. Cloud-hosted deployments should
        document their own data retention and subprocessors in production.
      </p>
      <p>
        Contact your workspace administrator for access, correction, or deletion requests related to
        your account.
      </p>
    </LegalDocument>
  );
}

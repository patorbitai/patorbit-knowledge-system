import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/shared/LegalPageLayout";

export const metadata: Metadata = {
  title: "Compliance - Patorbit",
  description:
    "Learn about Patorbit's compliance posture, certifications, data protection standards, and governance practices.",
};

export default function CompliancePage() {
  return (
    <LegalPageLayout
      title="Compliance"
      description="Patorbit is committed to operating with integrity and meeting the security, privacy, and data protection standards our users expect."
      lastUpdated="August 5, 2026"
      effectiveDate="August 5, 2026"
      version="v0.1"
      underDevelopment
    >
      <LegalSection number="1" title="Data Protection">
        <p>
          We align our practices with widely recognized data protection frameworks, including the principles
          of the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
          This document is under active development as we formalize our compliance program.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Security Standards">
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>Encryption of data in transit (TLS) and at rest.</li>
          <li>Role-based access controls and least-privilege principles.</li>
          <li>Regular security reviews and incident response procedures.</li>
        </ul>
      </LegalSection>

      <LegalSection number="3" title="Certifications & Standards">
        <p>
          We are working toward recognized certifications, including{" "}
          <span className="text-slate-300">SOC 2</span>. While the program is under development, we already
          apply the underlying controls and will publish certification details as they are completed.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Governance & Transparency">
        <p>
          We maintain documented policies for data retention, access, and deletion. Our privacy and terms
          pages describe your rights, and our security page details platform protections.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Contact">
        <p>
          For compliance-related enquiries, please reach out through our{" "}
          <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            contact page
          </Link>{" "}
          or review our{" "}
          <Link
            href="/security"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            security page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/shared/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy - Patorbit",
  description:
    "Read Patorbit's privacy policy to understand how we collect, use, and protect your personal and professional data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="We respect your privacy. This document explains how Patorbit collects, uses, protects, and shares your information."
      lastUpdated="August 5, 2026"
      effectiveDate="August 5, 2026"
      version="v0.1"
      underDevelopment
    >
      <LegalSection number="1" title="Introduction">
        <p>
          Patorbit (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates a platform for verified
          professional identity. This Privacy Policy explains what information we collect, why we collect
          it, and the choices you have.
        </p>
        <p className="mt-3">
          This document is under active development as our platform evolves. We will update it as our
          features mature, and we will notify you of material changes.
        </p>
      </LegalSection>

      <LegalSection number="2" title="Information We Collect">
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>
            <span className="text-slate-300">Account information</span> — name, email address, and
            authentication details when you create an account.
          </li>
          <li>
            <span className="text-slate-300">Professional data</span> — resumes, credentials, claims,
            evidence, and documents you upload to build your professional identity.
          </li>
          <li>
            <span className="text-slate-300">Usage data</span> — how you interact with the platform, such
            as pages visited and features used.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="3" title="How We Use Your Information">
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>To provide, operate, and maintain the platform.</li>
          <li>To verify professional claims and generate trust scores.</li>
          <li>To personalize your experience and improve our services.</li>
          <li>To communicate with you about your account and platform updates.</li>
        </ul>
      </LegalSection>

      <LegalSection number="4" title="How We Protect Your Information">
        <p>
          We use industry-standard security measures, including encryption in transit (TLS) and at rest, to
          safeguard your data. Access to your information is restricted to authorized personnel and systems.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Your Rights">
        <p>
          You have the right to access, correct, export, or delete your personal information. You can manage
          much of this directly through your account dashboard, or by contacting us.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Contact Us">
        <p>
          If you have questions about this Privacy Policy or how your data is handled, please contact us
          through our{" "}
          <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
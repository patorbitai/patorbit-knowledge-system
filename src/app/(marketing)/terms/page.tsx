import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/shared/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service - Patorbit",
  description:
    "Review Patorbit's terms of service to understand your rights and responsibilities when using the professional identity platform.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="By accessing or using Patorbit, you agree to these Terms of Service. Please read them carefully before proceeding."
      lastUpdated="August 5, 2026"
      effectiveDate="August 5, 2026"
      version="v0.1"
      underDevelopment
    >
      <LegalSection number="1" title="Acceptance of Terms">
        <p>
          These Terms of Service ("Terms") govern your use of the Patorbit professional identity platform.
          By creating an account or using the service, you accept and agree to be bound by these Terms,
          including any modifications.
        </p>
      </LegalSection>

      <LegalSection number="2" title="User Accounts">
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>
            <span className="text-slate-300">Account Responsibility</span> — You are responsible for
            maintaining the confidentiality of your account credentials and for all activities that occur
            under your account.
          </li>
          <li>
            <span className="text-slate-300">Accurate Information</span> — You must provide accurate and
            complete information when creating your account and updating your profile.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="3" title="Acceptable Use">
        <ul className="list-disc list-inside space-y-2 text-slate-400">
          <li>You will not use the platform for illegal activities.</li>
          <li>You will not attempt to circumvent security measures or access unauthorized areas.</li>
          <li>You will not upload malicious content or attempt to harm other users.</li>
        </ul>
      </LegalSection>

      <LegalSection number="4" title="Intellectual Property">
        <p>
          The Patorbit platform and its content are the property of Patorbit or its licensors. You retain
          ownership of your uploaded professional data and content, but you grant us a license to use
          it to provide the service.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Termination">
        <p>
          We may terminate or suspend your account and access to the platform for violations of these
          Terms, unlawful conduct, or other harmful behavior.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Patorbit shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection number="7" title="Contact">
        <p>
          Questions about these Terms? Please contact us through our{" "}
          <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
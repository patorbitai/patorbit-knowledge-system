import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import SocialProof from "@/components/marketing/SocialProof";
import Problem from "@/components/marketing/Problem";
import HowItWorks from "@/components/marketing/HowItWorks";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import TrustScoreDemo from "@/components/marketing/TrustScoreDemo";
import ProfessionalPassport from "@/components/marketing/ProfessionalPassport";
import WhyPatorbit from "@/components/marketing/WhyPatorbit";
import ComparisonTable from "@/components/marketing/ComparisonTable";
import CTA from "@/components/marketing/CTA";

export const metadata: Metadata = {
  title: "Patorbit — Build Better Resumes. Build Your Professional Identity.",
  description:
    "Create your Professional Identity once, then build multiple resumes and tailor each one to the job — without inventing experience. AI-assisted, truthful, user-controlled.",
  openGraph: {
    title: "Patorbit — Build Better Resumes. Build Your Professional Identity.",
    description:
      "Create your Professional Identity once, then build multiple resumes and tailor each one to the job — without inventing experience.",
    url: "https://www.patorbit.com",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patorbit — Build Better Resumes. Build Your Professional Identity.",
    description:
      "Create your Professional Identity once, then build multiple resumes and tailor each one to the job — without inventing experience.",
  },
  alternates: {
    canonical: "https://www.patorbit.com",
  },
};

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/**
 * Redirect authenticated users to the app instead of showing the public landing page.
 * Uses the existing per-page auth-guard pattern (same as /settings and /overview).
 */

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/overview");
  }

  return (
    <main className="bg-[#070B14] text-white">
      <Hero />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <FeatureGrid />
      <TrustScoreDemo />
      <ProfessionalPassport />
      <WhyPatorbit />
      <ComparisonTable />
      <CTA />
    </main>
  );
}

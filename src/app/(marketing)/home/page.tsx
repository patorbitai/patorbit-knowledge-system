import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import WorkflowStrip from "@/components/marketing/WorkflowStrip";
import ProductDemo from "@/components/marketing/ProductDemo";
import TruthfulAI from "@/components/marketing/TruthfulAI";
import Problem from "@/components/marketing/Problem";
import HowItWorks from "@/components/marketing/HowItWorks";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import WhyPatorbit from "@/components/marketing/WhyPatorbit";
import ComparisonTable from "@/components/marketing/ComparisonTable";
import CTA from "@/components/marketing/CTA";

const TITLE =
  "Patorbit — Build Your Resume Once. Tailor It to Every Job.";
const DESCRIPTION =
  "Build one source of truth for your career. Patorbit analyzes each job description, shows where you match, identifies skill gaps, and helps you tailor your resume without inventing experience.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.patorbit.com",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  alternates: {
    canonical: "https://www.patorbit.com",
  },
};

/**
 * Public marketing landing page.
 * Accessible to both authenticated and unauthenticated visitors.
 * Authenticated users are NOT redirected — they can view the landing page
 * and navigate back to the app via the sidebar.
 */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Patorbit",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://www.patorbit.com",
  description: DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "Free plan available. Professional plan from ₹149/month.",
  },
};

export default async function HomePage() {
  return (
    <main className="bg-[#070B14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <WorkflowStrip />
      <ProductDemo />
      <TruthfulAI />
      <Problem />
      <HowItWorks />
      <FeatureGrid />
      <WhyPatorbit />
      <ComparisonTable />
      <CTA />
    </main>
  );
}

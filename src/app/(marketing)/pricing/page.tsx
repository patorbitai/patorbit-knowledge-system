import type { Metadata } from "next";
import { PricingPageClient } from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing — Patorbit",
  description:
    "Start free with the Resume Builder. Professional at ₹149/month adds unlimited resumes, all templates, AI tailoring, and job matching — try it for ₹5 for 7 days.",
  openGraph: {
    title: "Pricing — Patorbit",
    description:
      "Start free with the Resume Builder. Professional at ₹149/month adds unlimited resumes, all templates, AI tailoring, and job matching — try it for ₹5 for 7 days.",
    url: "https://www.patorbit.com/pricing",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Patorbit",
    description:
      "Start free with the Resume Builder. Professional at ₹149/month adds unlimited resumes, all templates, AI tailoring, and job matching — try it for ₹5 for 7 days.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/pricing",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}

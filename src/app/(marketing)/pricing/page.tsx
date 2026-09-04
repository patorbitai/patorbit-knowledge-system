import type { Metadata } from "next";
import { PricingPageClient } from "./PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing — Patorbit",
  description:
    "Choose a Patorbit plan that fits your career goals. Start free with Resume Builder, or upgrade to Professional for Trust Score, Knowledge Graph, and AI Career Intelligence.",
  openGraph: {
    title: "Pricing — Patorbit",
    description:
      "Choose a Patorbit plan that fits your career goals. Start free with Resume Builder, or upgrade to Professional for Trust Score, Knowledge Graph, and AI Career Intelligence.",
    url: "https://www.patorbit.com/pricing",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Patorbit",
    description:
      "Choose a Patorbit plan that fits your career goals. Start free with Resume Builder, or upgrade to Professional for Trust Score, Knowledge Graph, and AI Career Intelligence.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/pricing",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}

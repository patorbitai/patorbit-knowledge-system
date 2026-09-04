import type { Metadata } from "next";
import { FeaturesPageClient } from "./FeaturesPageClient";

export const metadata: Metadata = {
  title: "Features — Patorbit",
  description:
    "Explore Patorbit's features: AI Resume Intelligence, Credential Verification, Knowledge Graph, Trust Score, Professional Passport, and more.",
  openGraph: {
    title: "Features — Patorbit",
    description:
      "Explore Patorbit's features: AI Resume Intelligence, Credential Verification, Knowledge Graph, Trust Score, Professional Passport, and more.",
    url: "https://www.patorbit.com/features",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — Patorbit",
    description:
      "Explore Patorbit's features: AI Resume Intelligence, Credential Verification, Knowledge Graph, Trust Score, Professional Passport, and more.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/features",
  },
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}

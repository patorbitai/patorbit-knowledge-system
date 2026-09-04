import type { Metadata } from "next";
import { PlatformPageClient } from "./PlatformPageClient";

export const metadata: Metadata = {
  title: "Platform — Patorbit",
  description:
    "Explore the Patorbit platform: Knowledge Graph, Trust Score, Professional Passport, Evidence Management, and AI-powered career intelligence.",
  openGraph: {
    title: "Platform — Patorbit",
    description:
      "Explore the Patorbit platform: Knowledge Graph, Trust Score, Professional Passport, Evidence Management, and AI-powered career intelligence.",
    url: "https://www.patorbit.com/platform",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform — Patorbit",
    description:
      "Explore the Patorbit platform: Knowledge Graph, Trust Score, Professional Passport, Evidence Management, and AI-powered career intelligence.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/platform",
  },
};

export default function PlatformPage() {
  return <PlatformPageClient />;
}

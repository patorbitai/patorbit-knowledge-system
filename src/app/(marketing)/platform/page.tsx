import type { Metadata } from "next";
import { PlatformPageClient } from "./PlatformPageClient";

export const metadata: Metadata = {
  title: "Platform — Patorbit",
  description:
    "Under the resume builder: structured professional identity, claims and evidence, trust signals, and the knowledge graph that powers job matching.",
  openGraph: {
    title: "Platform — Patorbit",
    description:
      "Under the resume builder: structured professional identity, claims and evidence, trust signals, and the knowledge graph that powers job matching.",
    url: "https://www.patorbit.com/platform",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform — Patorbit",
    description:
      "Under the resume builder: structured professional identity, claims and evidence, trust signals, and the knowledge graph that powers job matching.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/platform",
  },
};

export default function PlatformPage() {
  return <PlatformPageClient />;
}

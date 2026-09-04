import type { Metadata } from "next";
import { AboutPageClient } from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About — Patorbit",
  description:
    "Learn about Patorbit's mission to build the infrastructure for verified professional identity through evidence-backed trust.",
  openGraph: {
    title: "About — Patorbit",
    description:
      "Learn about Patorbit's mission to build the infrastructure for verified professional identity through evidence-backed trust.",
    url: "https://www.patorbit.com/about",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Patorbit",
    description:
      "Learn about Patorbit's mission to build the infrastructure for verified professional identity through evidence-backed trust.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/about",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}

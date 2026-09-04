import type { Metadata } from "next";
import { SolutionsPageClient } from "./SolutionsPageClient";

export const metadata: Metadata = {
  title: "Solutions — Patorbit",
  description:
    "Discover how Patorbit helps individuals, recruiters, and organizations build verified professional identities and make trust-backed hiring decisions.",
  openGraph: {
    title: "Solutions — Patorbit",
    description:
      "Discover how Patorbit helps individuals, recruiters, and organizations build verified professional identities and make trust-backed hiring decisions.",
    url: "https://www.patorbit.com/solutions",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solutions — Patorbit",
    description:
      "Discover how Patorbit helps individuals, recruiters, and organizations build verified professional identities and make trust-backed hiring decisions.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/solutions",
  },
};

export default function SolutionsPage() {
  return <SolutionsPageClient />;
}

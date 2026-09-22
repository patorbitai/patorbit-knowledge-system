import type { Metadata } from "next";
import { SolutionsPageClient } from "./SolutionsPageClient";

export const metadata: Metadata = {
  title: "Solutions — Patorbit",
  description:
    "How individuals use Patorbit to build a resume once and tailor it per job — and how teams can evaluate evidence-backed professional profiles.",
  openGraph: {
    title: "Solutions — Patorbit",
    description:
      "How individuals use Patorbit to build a resume once and tailor it per job — and how teams can evaluate evidence-backed professional profiles.",
    url: "https://www.patorbit.com/solutions",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solutions — Patorbit",
    description:
      "How individuals use Patorbit to build a resume once and tailor it per job — and how teams can evaluate evidence-backed professional profiles.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/solutions",
  },
};

export default function SolutionsPage() {
  return <SolutionsPageClient />;
}

import type { Metadata } from "next";
import { FeaturesPageClient } from "./FeaturesPageClient";

export const metadata: Metadata = {
  title: "Features — Patorbit",
  description:
    "Build your resume once, match it against any job description, tailor suggestions without fabricating experience, see skill gaps, and export ATS-friendly PDFs.",
  openGraph: {
    title: "Features — Patorbit",
    description:
      "Build your resume once, match it against any job description, tailor suggestions without fabricating experience, see skill gaps, and export ATS-friendly PDFs.",
    url: "https://www.patorbit.com/features",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — Patorbit",
    description:
      "Build your resume once, match it against any job description, tailor suggestions without fabricating experience, see skill gaps, and export ATS-friendly PDFs.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/features",
  },
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}

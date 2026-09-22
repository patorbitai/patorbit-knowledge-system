import type { Metadata } from "next";
import { AboutPageClient } from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About — Patorbit",
  description:
    "Patorbit keeps one source of truth for your career, analyzes each job description against it, and helps you tailor your application without inventing experience.",
  openGraph: {
    title: "About — Patorbit",
    description:
      "Patorbit keeps one source of truth for your career, analyzes each job description against it, and helps you tailor your application without inventing experience.",
    url: "https://www.patorbit.com/about",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Patorbit",
    description:
      "Patorbit keeps one source of truth for your career, analyzes each job description against it, and helps you tailor your application without inventing experience.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/about",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}

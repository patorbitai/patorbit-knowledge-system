import type { Metadata } from "next";
import { CareerPassportPageClient } from "./CareerPassportPageClient";

export const metadata: Metadata = {
  title: "Professional Passport — Patorbit",
  description:
    "Build a shareable, verifiable Professional Passport that consolidates your verified claims, evidence, and Trust Score into a single link.",
  openGraph: {
    title: "Professional Passport — Patorbit",
    description:
      "Build a shareable, verifiable Professional Passport that consolidates your verified claims, evidence, and Trust Score into a single link.",
    url: "https://www.patorbit.com/career-passport",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Passport — Patorbit",
    description:
      "Build a shareable, verifiable Professional Passport that consolidates your verified claims, evidence, and Trust Score into a single link.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/career-passport",
  },
};

export default function CareerPassportPage() {
  return <CareerPassportPageClient />;
}

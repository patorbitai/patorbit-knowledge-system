import type { Metadata } from "next";
import { ContactPageClient } from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact — Patorbit",
  description:
    "Get in touch with the Patorbit team. Reach out for support, partnerships, enterprise inquiries, or general questions.",
  openGraph: {
    title: "Contact — Patorbit",
    description:
      "Get in touch with the Patorbit team. Reach out for support, partnerships, enterprise inquiries, or general questions.",
    url: "https://www.patorbit.com/contact",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — Patorbit",
    description:
      "Get in touch with the Patorbit team. Reach out for support, partnerships, enterprise inquiries, or general questions.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/contact",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}

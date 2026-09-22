import type { Metadata } from "next";
import { EnterprisePageClient } from "./EnterprisePageClient";

export const metadata: Metadata = {
  title: "Enterprise — Patorbit",
  description:
    "Patorbit for teams and institutions: organization workspaces, evidence-backed profiles, and custom integrations. Contact us for details — some capabilities are in development.",
  openGraph: {
    title: "Enterprise — Patorbit",
    description:
      "Patorbit for teams and institutions: organization workspaces, evidence-backed profiles, and custom integrations. Contact us for details — some capabilities are in development.",
    url: "https://www.patorbit.com/enterprise",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enterprise — Patorbit",
    description:
      "Patorbit for teams and institutions: organization workspaces, evidence-backed profiles, and custom integrations. Contact us for details — some capabilities are in development.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/enterprise",
  },
};

export default function EnterprisePage() {
  return <EnterprisePageClient />;
}

import type { Metadata } from "next";
import { EnterprisePageClient } from "./EnterprisePageClient";

export const metadata: Metadata = {
  title: "Enterprise — Patorbit",
  description:
    "Patorbit Enterprise: organization workspaces, verification workflows, API access, SSO/SCIM, and custom integrations for teams and institutions.",
  openGraph: {
    title: "Enterprise — Patorbit",
    description:
      "Patorbit Enterprise: organization workspaces, verification workflows, API access, SSO/SCIM, and custom integrations for teams and institutions.",
    url: "https://www.patorbit.com/enterprise",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enterprise — Patorbit",
    description:
      "Patorbit Enterprise: organization workspaces, verification workflows, API access, SSO/SCIM, and custom integrations for teams and institutions.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/enterprise",
  },
};

export default function EnterprisePage() {
  return <EnterprisePageClient />;
}

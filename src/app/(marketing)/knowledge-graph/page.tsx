import type { Metadata } from "next";
import { KnowledgeGraphPageClient } from "./KnowledgeGraphPageClient";

export const metadata: Metadata = {
  title: "Knowledge Graph — Patorbit",
  description:
    "Explore how Patorbit's Knowledge Graph maps relationships between your skills, experience, education, and career opportunities.",
  openGraph: {
    title: "Knowledge Graph — Patorbit",
    description:
      "Explore how Patorbit's Knowledge Graph maps relationships between your skills, experience, education, and career opportunities.",
    url: "https://www.patorbit.com/knowledge-graph",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowledge Graph — Patorbit",
    description:
      "Explore how Patorbit's Knowledge Graph maps relationships between your skills, experience, education, and career opportunities.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/knowledge-graph",
  },
};

export default function KnowledgeGraphPage() {
  return <KnowledgeGraphPageClient />;
}

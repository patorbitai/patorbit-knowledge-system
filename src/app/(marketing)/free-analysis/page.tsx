import type { Metadata } from "next";
import { FreeJDAnalysis } from "@/components/marketing/FreeJDAnalysis";

export const metadata: Metadata = {
  title: "Free Job Description Analysis — Patorbit",
  description:
    "Paste a job description and get a structured analysis of requirements, skills, seniority, and more. Free, instant, no signup required.",
  openGraph: {
    title: "Free Job Description Analysis — Patorbit",
    description:
      "Paste a job description and get a structured analysis of requirements, skills, seniority, and more.",
    url: "https://www.patorbit.com/free-analysis",
    siteName: "Patorbit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Job Description Analysis — Patorbit",
    description:
      "Paste a job description and get a structured analysis of requirements, skills, seniority, and more.",
  },
  alternates: {
    canonical: "https://www.patorbit.com/free-analysis",
  },
};

export default function FreeAnalysisPage() {
  return (
    <main className="bg-[#070B14] text-white min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Free Tool
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Analyze Any Job Description
          </h1>
          <p className="mt-3 text-[15px] text-slate-400 leading-relaxed max-w-xl">
            Paste a job description and Patorbit will identify the role, skills, requirements,
            seniority, responsibilities, and other structured signals — instantly.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            This analysis is extracted from the text you provide. It does not verify the employer or job listing.
          </p>
        </div>

        {/* Analysis Component */}
        <FreeJDAnalysis />

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span>No signup required</span>
            <span>•</span>
            <span>Instant analysis</span>
            <span>•</span>
            <span>Runs in your browser</span>
          </div>
        </div>
      </div>
    </main>
  );
}

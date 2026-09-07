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
    <main className="relative bg-[#070B14] text-white min-h-screen overflow-hidden">
      {/* Background layers — matching Hero design */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/80 via-[#070B14]/95 to-[#070B14]" />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-cyan-500/[0.08] via-blue-500/[0.04] to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[400px] bg-gradient-radial from-purple-500/[0.06] via-transparent to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[300px] bg-gradient-radial from-blue-500/[0.05] via-transparent to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
        {/* Hero Header */}
        <div className="mb-12 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm px-4 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Free Tool
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
            Analyze Any{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Job Description
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-[17px] text-slate-400 leading-relaxed max-w-lg mx-auto">
            Paste a job description and Patorbit will identify the role, skills, requirements,
            seniority, responsibilities, and other structured signals — instantly.
          </p>

          {/* Trust line */}
          <p className="mt-3 text-xs text-slate-500">
            This analysis is extracted from the text you provide. It does not verify the employer or job listing.
          </p>
        </div>

        {/* Analysis Component */}
        <FreeJDAnalysis />

        {/* Footer trust signals */}
        <div className="mt-16 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              No signup required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-cyan-400" />
              Instant analysis
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              Runs in your browser
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

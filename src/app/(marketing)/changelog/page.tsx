import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog - Patorbit",
  description:
    "Track the latest updates, feature releases, improvements, and fixes to the Patorbit platform.",
};

interface ChangeEntry {
  version: string;
  date: string;
  title: string;
  type: "feature" | "improvement" | "fix";
  description: string;
}

const changes: ChangeEntry[] = [
  {
    version: "v0.4.0",
    date: "August 5, 2026",
    title: "Identity Pipeline & Trust Reports",
    type: "feature",
    description:
      "Introduced an automatic identity pipeline refresh and a Trust Report aggregation layer, laying the foundation for the formal Trust Score.",
  },
  {
    version: "v0.3.0",
    date: "July 2026",
    title: "Claim & Evidence Foundation",
    type: "feature",
    description:
      "Implemented the Claim → Evidence model and began emitting claim and evidence nodes into the knowledge graph.",
  },
  {
    version: "v0.2.0",
    date: "July 2026",
    title: "Knowledge Graph Architecture",
    type: "feature",
    description:
      "Established the knowledge graph architecture that underpins connected, searchable professional data.",
  },
  {
    version: "v0.1.0",
    date: "June 2026",
    title: "Public Launch",
    type: "feature",
    description:
      "Launched the Patorbit marketing site, including the resume import and AI extraction preview.",
  },
];

const typeStyles: Record<ChangeEntry["type"], string> = {
  feature: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  improvement: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  fix: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

const typeLabels: Record<ChangeEntry["type"], string> = {
  feature: "New Feature",
  improvement: "Improvement",
  fix: "Fix",
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">
              Changelog
            </span>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              What&apos;s new at Patorbit
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Follow the latest features, improvements, and fixes as we build the infrastructure for
              verified professional identity.
            </p>
          </div>

          <div className="space-y-6">
            {changes.map((entry) => (
              <div
                key={entry.version}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h2 className="text-xl font-semibold text-white">{entry.title}</h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${typeStyles[entry.type]}`}
                  >
                    {typeLabels[entry.type]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                  <span className="font-semibold text-cyan-400">{entry.version}</span>
                  <span>·</span>
                  <span>{entry.date}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{entry.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Have questions about a release?
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
import { User, ClipboardPaste, Target, CheckCircle2 } from "lucide-react";

/* Static server component: 4 steps, each with real-looking product UI.
   No scroll animation — content is visible on first paint. */

const skills = ["Python", "SQL", "Azure", "PySpark"];

const mustHave = [
  "5+ years building data pipelines",
  "Strong Python and SQL",
  "Experience with dbt and Snowflake",
  "Healthcare / HIPAA data a plus",
];

const matchRows = [
  {
    requirement: "Python",
    variant: "match" as const,
    evidence: "Found in your profile: “Built Python ETL pipelines…”",
  },
  {
    requirement: "dbt",
    variant: "partial" as const,
    evidence: "Related experience found — surfaced only where honest",
  },
  {
    requirement: "HIPAA",
    variant: "gap" as const,
    evidence: "Not in your profile — reported as a gap, not invented",
  },
];

const matchStyles = {
  match: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  partial: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  gap: "border-red-500/30 bg-red-500/10 text-red-300",
};

const steps = [
  {
    icon: User,
    title: "Build your professional profile",
    description:
      "Import your existing resume or enter it once. This is the single source of truth every resume is built from.",
    ui: (
      <div className="rounded-lg border border-subtle bg-slate-900/50 p-3.5 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
          Your master profile · Experience
        </div>
        <div className="text-xs font-semibold text-ink">
          Senior Data Engineer · Nimbus Retail
        </div>
        <div className="text-[11px] text-ink-muted">2022 – Present</div>
        <ul className="space-y-1">
          <li className="flex items-start gap-2 text-[11px] text-ink-secondary leading-snug">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-600 shrink-0" />
            Built Azure Data Factory pipelines feeding a Snowflake warehouse
          </li>
          <li className="flex items-start gap-2 text-[11px] text-ink-secondary leading-snug">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-600 shrink-0" />
            Mentored 2 junior engineers on SQL code review
          </li>
        </ul>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map((s) => (
            <span
              key={s}
              className="rounded border border-slate-700/70 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: ClipboardPaste,
    title: "Add a job",
    description:
      "Paste the job description for the role you want. Patorbit compares it against your profile — nothing else.",
    ui: (
      <div className="rounded-lg border border-subtle bg-slate-900/50 p-3.5 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
          Pasted job description
        </div>
        <div className="text-xs font-semibold text-ink">
          Senior Data Engineer — Meridian Health
        </div>
        <ul className="space-y-1">
          {mustHave.map((m) => (
            <li
              key={m}
              className="flex items-start gap-2 text-[11px] text-ink-secondary leading-snug"
            >
              <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-600 shrink-0" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: Target,
    title: "See the evidence-based match and tailor",
    description:
      "Every requirement is matched against evidence in your profile. Matches, partials and gaps are shown explicitly — suggestions only reword what you already did.",
    ui: (
      <div className="rounded-lg border border-subtle bg-slate-900/50 p-3.5 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
          Requirement-by-requirement match
        </div>
        <ul className="space-y-2">
          {matchRows.map((row) => (
            <li key={row.requirement} className="space-y-1">
              <span
                className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${matchStyles[row.variant]}`}
              >
                {row.requirement}
              </span>
              <p className="text-[11px] text-ink-secondary leading-snug">
                {row.evidence}
              </p>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: CheckCircle2,
    title: "Review and export",
    description:
      "Accept, edit or reject every suggested change. Nothing is saved until you approve it — then export PDF or DOCX.",
    ui: (
      <div className="rounded-lg border border-subtle bg-slate-900/50 p-3.5 space-y-2.5">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">
          Suggested change — yours to approve
        </div>
        <p className="text-[11px] text-ink leading-snug">
          “Mentored 2 junior engineers through structured SQL review, raising
          query standards across the team”
        </p>
        <p className="text-[10px] text-cyan-400/80">
          Reworded from your experience — no new facts added
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
            Accept
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-[10px] font-medium text-ink-secondary">
            Reject
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <span className="rounded border border-slate-700/70 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
              PDF
            </span>
            <span className="rounded border border-slate-700/70 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
              DOCX
            </span>
          </span>
        </div>
        <p className="text-[10px] text-ink-muted">
          Your master profile is never edited by tailoring.
        </p>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-surface-sunken py-20 lg:py-28 overflow-hidden scroll-mt-20"
      aria-label="How It Works"
    >
      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-subtle bg-slate-900/60 px-3.5 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-ink-secondary">
              How it works
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink lg:text-4xl">
            Four steps from your profile to{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              a tailored resume
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-ink-secondary leading-relaxed max-w-2xl mx-auto">
            Add a job, see the evidence-based match, and export a resume built
            for that role — your master profile never changes.
          </p>
        </div>

        {/* Steps */}
        <ol className="space-y-5 max-w-5xl mx-auto list-none">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="grid md:grid-cols-[1fr_1.1fr] gap-5 md:gap-8 items-start rounded-xl border border-subtle bg-surface p-5 md:p-6"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                    <step.icon className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold tabular-nums text-cyan-400">
                    Step {i + 1} of 4
                  </span>
                </div>
                <h3 className="text-base font-semibold text-ink mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
              <div>{step.ui}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

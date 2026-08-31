import Link from "next/link";
import { ImportButton } from "@/components/resume-builder/ImportButton";
import type { IdentityScoreData } from "@/lib/identity-score";

type Props = {
  name: string;
  email: string;
  data: IdentityScoreData;
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score, 100) / 100);

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="8" className="stroke-white/[0.06]" />
        <circle
          cx="64" cy="64" r={radius} fill="none" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
          style={{ stroke: "url(#scoreGradient)" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-label={`Identity Score: ${score} out of 100`}>
        <span className="text-3xl font-bold text-white leading-none">{score}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function contextualCTA(data: IdentityScoreData): { label: string; href: string } {
  if (data.resumeCompleteness === 0) return { label: "Start building your resume", href: "/resume-builder" };
  if (data.verifiedCredentials === 0) return { label: "Verify your first credential", href: "/trust" };
  if (data.passportClaims === 0) return { label: "Build your shareable passport", href: "/passport" };
  if (!data.aiUsed) return { label: "Run an AI career analysis", href: "/ai" };
  return { label: "Share your passport", href: "/passport" };
}

export default function IdentityHero({ name, email, data }: Props) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const cta = contextualCTA(data);
  const firstName = name.split(" ")[0] || "there";

  return (
    <section
      aria-label="Professional Identity"
      className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#080C18] p-6 sm:p-8"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/[0.05] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-purple-500/[0.05] blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Left — identity */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center lg:flex-1 lg:min-w-0">
          {/* Score ring */}
          <ScoreRing score={data.score} />

          {/* Identity info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-white truncate">
                  {firstName}&apos;s Professional Identity
                </h1>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-md">
              Your Identity Score reflects how complete, verified, and trusted your professional profile is.
              Build your resume, verify credentials, and grow your passport to raise it.
            </p>

            {/* Micro-stats */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none">{data.verifiedCredentials}</span>
                <span className="mt-0.5 text-[11px] text-slate-500">Verified credentials</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none">{data.passportClaims}</span>
                <span className="mt-0.5 text-[11px] text-slate-500">Passport claims</span>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none">{data.resumeCompleteness}%</span>
                <span className="mt-0.5 text-[11px] text-slate-500">Resume completeness</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5">
              <Link
                href={cta.href}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
              >
                {cta.label}
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Right — Import Resume */}
        <div className="w-full shrink-0 lg:w-64">
          <ImportButton variant="hero" />
        </div>
      </div>
    </section>
  );
}

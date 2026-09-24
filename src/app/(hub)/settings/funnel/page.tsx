/**
 * Internal funnel analytics view (§17).
 *
 * Answers: where do users drop off between landing → signup → upload →
 * profile → job analysis → tailoring → export? Auth required.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { readEvents } from "@/lib/analytics-server";
import { buildFunnelReport } from "@/lib/analytics";

export const metadata = {
  title: "Funnel — Patorbit (internal)",
  robots: { index: false, follow: false },
};

const STEP_LABELS: Record<string, string> = {
  landing_view: "Landing page viewed",
  landing_cta_clicked: "Primary CTA clicked",
  signup_started: "Sign-up started",
  signup_completed: "Account created",
  verification_sent: "Verification email sent",
  verification_completed: "Email verified",
  verification_failed: "Verification failed or expired",
  onboarding_started: "Onboarding started",
  resume_upload_completed: "Resume uploaded & parsed",
  profile_created: "Profile created",
  job_added: "First job added",
  job_analysis_completed: "Job analyzed",
  tailoring_completed: "Resume tailored",
  resume_exported: "Resume exported",
  upgrade_viewed: "Upgrade prompt viewed",
  checkout_started: "Checkout started",
  subscription_completed: "Subscription completed",
  match_viewed: "Match dashboard viewed",
  evidence_viewed: "Evidence inspected",
  gap_viewed: "Skill gaps inspected",
  suggestion_accepted: "AI suggestion accepted",
  suggestion_rejected: "AI suggestion rejected",
  suggestion_edited: "AI suggestion edited",
  resume_export_started: "Export started",
};

function pct(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}

export default async function FunnelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/settings/funnel");

  const records = await readEvents();
  const report = buildFunnelReport(records);

  const first = report.steps[0]?.unique ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activation funnel</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {report.totalRecords} events recorded. Conversion is measured in unique browser sessions — no personal
          information is collected.
        </p>
      </div>

      {/* Funnel steps */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] divide-y divide-gray-100 dark:divide-white/[0.05]">
        {report.steps.map((step, i) => {
          const width = first > 0 ? Math.max(2, Math.round((step.unique / first) * 100)) : 0;
          const drop = i > 0 ? (report.steps[i - 1].unique ?? 0) - (step.unique ?? 0) : 0;
          return (
            <div key={step.event} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    <span className="text-gray-400 dark:text-slate-500 mr-2">{i + 1}.</span>
                    {STEP_LABELS[step.event] ?? step.event}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    {step.total} events · {step.unique} sessions
                    {i > 0 && drop > 0 && (
                      <span className="text-rose-500 dark:text-rose-400"> · −{drop} dropped here</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{step.unique}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 tabular-nums">
                    {pct(step.conversionFromPrevious)} of previous
                  </p>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Workflow engagement (§24) */}
      {report.workflow.some((w) => w.total > 0) && (
        <section className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Matching &amp; tailoring workflow</h2>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Feature-level engagement — reported outside the activation funnel.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-gray-100 dark:divide-white/[0.05]">
            {report.workflow.map((w) => (
              <div key={w.event} className="px-5 py-4">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  {STEP_LABELS[w.event] ?? w.event}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{w.unique}</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-500">{w.total} events</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Conversion events */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Monetization</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-white/[0.05]">
          {report.conversion.map((c) => (
            <div key={c.event} className="px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-slate-500">
                {STEP_LABELS[c.event] ?? c.event}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{c.unique}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">{c.total} events</p>
            </div>
          ))}
        </div>
      </section>

      {report.totalRecords === 0 && (
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
          No events yet — walk the product journey and events will appear here within a second.
        </p>
      )}
    </div>
  );
}

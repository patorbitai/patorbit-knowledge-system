import Link from "next/link";
import { getServerSession } from "next-auth";
import { MessagesSquare, Plus, Upload, Sparkles, CalendarClock, Target } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { interviewProfileService } from "@/services/interview-profile.service";
import { interviewAnalyticsService } from "@/services/interview-analytics.service";
import { usageService } from "@/services/usage.service";
import { entitlementService } from "@/services/entitlement.service";
import { INTERVIEW_USAGE, interviewTypeLabel } from "@/lib/interview/constants";
import { formatDateTime, relativeToNow } from "@/lib/interview/client";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import {
  EmptyState,
  LinkButton,
  ProgressBar,
  ScoreTrend,
  StatTile,
  TopicPill,
} from "@/components/hub/interview/ui";

export const metadata = {
  title: "Interview Preparation — Patorbit",
  description: "Prepare for real interviews with your resume, job description and invitation in one place.",
};

export const dynamic = "force-dynamic";

/** Read the clock outside render so the page stays a pure render pass. */
function currentTimestamp(): number {
  return Date.now();
}

export default async function InterviewPreparationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const identity = await identityService.ensureProfessionalIdentity(session.user.id);
  const [profiles, analytics, entitlements, preparation, practice, mock] = await Promise.all([
    interviewProfileService.list(identity.id),
    interviewAnalyticsService.overview(identity.id),
    entitlementService.getUserEntitlements(session.user.id),
    usageService.peekUsage(session.user.id, INTERVIEW_USAGE.preparation),
    usageService.peekUsage(session.user.id, INTERVIEW_USAGE.practice),
    usageService.peekUsage(session.user.id, INTERVIEW_USAGE.mock),
  ]);

  const now = currentTimestamp();
  const upcoming = profiles
    .filter((profile) => profile.interviewDate && new Date(profile.interviewDate).getTime() >= now)
    .sort((a, b) => new Date(a.interviewDate as string).getTime() - new Date(b.interviewDate as string).getTime())
    .slice(0, 4);

  const quotaLabel = (state: { limit: number; remaining: number }) =>
    state.limit === -1 ? "Unlimited" : `${state.remaining} left`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-soft text-brand">
              <MessagesSquare className="h-4 w-4" />
            </span>
            <h1 className="text-page-title text-ink">Interview Preparation</h1>
          </div>
          <p className="mt-2 max-w-2xl text-secondary-size text-ink-secondary">
            Bring an interview invitation, your resume and the job description. Patorbit maps what to
            prepare, generates practice questions, runs mock interviews and reports exactly where you
            stand.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/interview-preparation/new" icon={<Plus className="h-4 w-4" />}>
            New interview
          </LinkButton>
          <LinkButton
            href="/interview-preparation/import"
            variant="secondary"
            icon={<Upload className="h-4 w-4" />}
          >
            Import invitation
          </LinkButton>
        </div>
      </header>

      <section aria-label="Plan usage" className="rounded-xl border border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge tone="brand">{entitlements.tier} plan</Badge>
            <span className="text-secondary-size text-ink-secondary">
              Preparation plans: <strong className="text-ink">{quotaLabel(preparation)}</strong>
              {" · "}Practice sessions: <strong className="text-ink">{quotaLabel(practice)}</strong>
              {" · "}Mock interviews: <strong className="text-ink">{quotaLabel(mock)}</strong>
            </span>
          </div>
          <Link href="/settings" className="text-label text-brand hover:underline">
            Manage plan
          </Link>
        </div>
      </section>

      <section aria-label="Interview metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Upcoming"
          value={analytics.totals.upcoming}
          hint={analytics.totals.upcoming === 0 ? "Nothing scheduled" : "Interviews ahead"}
        />
        <StatTile label="Mock interviews" value={analytics.totals.completedMocks} hint="Completed" />
        <StatTile
          label="Average score"
          value={analytics.scores.average === null ? "—" : `${analytics.scores.average}%`}
          hint={analytics.scores.average === null ? "No completed sessions yet" : "Across completed sessions"}
          tone="brand"
        />
        <StatTile
          label="Prep completion"
          value={`${analytics.preparation.averageProgress}%`}
          hint={`${analytics.preparation.plans} plan${analytics.preparation.plans === 1 ? "" : "s"}`}
        />
      </section>

      {profiles.length === 0 ? (
        <EmptyState
          title="No interview profiles yet"
          description="Create a profile from a job application or from an invitation email. Everything you practise afterwards is grounded in that profile and your resume."
          actions={
            <>
              <LinkButton href="/interview-preparation/new" icon={<Plus className="h-4 w-4" />}>
                Create interview profile
              </LinkButton>
              <LinkButton href="/interview-preparation/import" variant="secondary" icon={<Upload className="h-4 w-4" />}>
                Import an invitation
              </LinkButton>
            </>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" padding="md">
              <CardHeader
                title="Upcoming interviews"
                description="Scheduled rounds across your interview profiles."
                icon={CalendarClock}
                action={
                  <Link href="/interview-preparation" className="text-label text-brand hover:underline">
                    All profiles
                  </Link>
                }
              />
              {upcoming.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line p-4 text-secondary-size text-ink-muted">
                  No interview dates are scheduled. Add a date to a profile to see it here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((profile) => (
                    <li key={profile.id}>
                      <Link
                        href={`/interview-preparation/${profile.id}`}
                        className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-raised p-3 transition-colors hover:border-strong sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-body font-semibold text-ink">
                            {profile.companyName} · {profile.jobTitle}
                          </p>
                          <p className="mt-0.5 text-label text-ink-secondary">
                            {formatDateTime(profile.interviewDate, profile.timezone)} ·{" "}
                            {interviewTypeLabel(profile.interviewType)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone="info">{relativeToNow(profile.interviewDate)}</Badge>
                          <StatusBadge status={profile.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="md">
              <CardHeader title="Score progression" description="Completed sessions only." icon={Target} />
              <ScoreTrend points={analytics.scores.progression} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" padding="md">
              <CardHeader title="Your interview profiles" description="Each profile keeps its own rounds, plan and practice history." />
              <ul className="space-y-2">
                {profiles.map((profile) => (
                  <li key={profile.id}>
                    <Link
                      href={`/interview-preparation/${profile.id}`}
                      className="block rounded-lg border border-subtle bg-surface-raised p-3 transition-colors hover:border-strong"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-body font-semibold text-ink">
                          {profile.companyName} · {profile.jobTitle}
                        </p>
                        <div className="flex items-center gap-2">
                          {profile.latestScore !== null && (
                            <Badge tone="brand">{profile.latestScore}%</Badge>
                          )}
                          <StatusBadge status={profile.status} />
                        </div>
                      </div>
                      <p className="mt-1 text-label text-ink-secondary">
                        {interviewTypeLabel(profile.interviewType)} ·{" "}
                        {profile.roundCount ?? 0} round{(profile.roundCount ?? 0) === 1 ? "" : "s"} ·{" "}
                        {profile.completedSessions ?? 0} session{(profile.completedSessions ?? 0) === 1 ? "" : "s"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-4">
              <Card padding="md">
                <CardHeader title="Weakest topics" description="From your completed answers." />
                {analytics.weakestTopics.length === 0 ? (
                  <p className="text-secondary-size text-ink-muted">
                    Topic tracking starts after your first completed practice or mock session.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analytics.weakestTopics.map((topic) => (
                      <TopicPill key={topic.topic} label={topic.label} average={topic.average} />
                    ))}
                  </div>
                )}
              </Card>

              <Card padding="md">
                <CardHeader title="What to do next" icon={Sparkles} />
                {analytics.recommendations.length === 0 ? (
                  <p className="text-secondary-size text-ink-muted">
                    Add an interview profile to get a preparation plan.
                  </p>
                ) : (
                  <ul className="space-y-2 text-secondary-size text-ink-secondary">
                    {analytics.recommendations.map((recommendation) => (
                      <li key={recommendation} className="flex gap-2">
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          {analytics.strongestTopics.length > 0 && (
            <Card padding="md">
              <CardHeader title="Strongest topics" description="Highest average across completed answers." />
              <div className="flex flex-wrap gap-2">
                {analytics.strongestTopics.map((topic) => (
                  <TopicPill key={topic.topic} label={topic.label} average={topic.average} />
                ))}
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-meta text-ink-muted">
                  <span>Preparation completion</span>
                  <span>{analytics.preparation.averageProgress}%</span>
                </div>
                <ProgressBar value={analytics.preparation.averageProgress} />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

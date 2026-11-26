import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, CalendarClock, FileText, ListChecks, Target } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { interviewProfileService, InterviewNotFoundError } from "@/services/interview-profile.service";
import { interviewRoundService } from "@/services/interview-round.service";
import { interviewPlanService } from "@/services/interview-plan.service";
import { interviewSessionService } from "@/services/interview-session.service";
import { interviewAnalyticsService } from "@/services/interview-analytics.service";
import { interviewTypeLabel } from "@/lib/interview/constants";
import { formatDateTime, relativeToNow } from "@/lib/interview/client";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import ProfileActions from "@/components/hub/interview/ProfileActions";
import { LinkButton, ProgressBar, TopicPill } from "@/components/hub/interview/ui";

export const dynamic = "force-dynamic";

export default async function InterviewProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const identity = await identityService.ensureProfessionalIdentity(session.user.id);

  let profile;
  try {
    profile = await interviewProfileService.get(identity.id, profileId);
  } catch (err) {
    if (err instanceof InterviewNotFoundError) notFound();
    throw err;
  }

  const [rounds, plan, sessions, analytics] = await Promise.all([
    interviewRoundService.list(identity.id, profileId),
    interviewPlanService.getLatest(identity.id, profileId),
    interviewSessionService.list(identity.id, profileId),
    interviewAnalyticsService.forProfile(identity.id, profileId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link
          href="/interview-preparation"
          className="inline-flex items-center gap-1.5 text-label text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Interview Preparation
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-page-title text-ink">
              {profile.companyName} · {profile.jobTitle}
            </h1>
            <p className="mt-1.5 text-secondary-size text-ink-secondary">
              {interviewTypeLabel(profile.interviewType)}
              {profile.experienceYears ? ` · ${profile.experienceYears}+ years` : ""}
              {profile.seniority ? ` · ${profile.seniority}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{relativeToNow(profile.interviewDate) ?? "Not scheduled"}</Badge>
            <StatusBadge status={profile.status} />
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-label text-ink-secondary">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatDateTime(profile.interviewDate, profile.timezone)} · {profile.timezone}
          {profile.durationMinutes ? ` · ${profile.durationMinutes} min` : ""}
        </p>
      </div>

      <ProfileActions profileId={profile.id} rounds={rounds} hasPlan={Boolean(plan)} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="md">
          <CardHeader title="Interview timeline" description="Rounds are append-only — completed rounds keep their history." icon={ListChecks} />
          {rounds.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-4 text-secondary-size text-ink-muted">
              No rounds recorded yet. Use “Add round” to add the next stage of this process.
            </p>
          ) : (
          <ol className="relative space-y-3 border-l border-subtle pl-4">
            {rounds.map((round) => {
              const roundSessions = sessions.filter((entry) => entry.roundId === round.id);
              return (
                <li key={round.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full border border-surface bg-brand"
                  />
                  <div className="rounded-lg border border-subtle bg-surface-raised p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-body font-semibold text-ink">
                        {round.order}. {round.roundName}
                      </p>
                      <StatusBadge status={round.status} />
                    </div>
                    <p className="mt-1 text-label text-ink-secondary">
                      {interviewTypeLabel(round.roundType)} · {formatDateTime(round.interviewDate, round.timezone)}
                    </p>
                    <p className="mt-1 text-meta text-ink-muted">
                      {round.completedSessions} completed of {round.sessionCount} session
                      {round.sessionCount === 1 ? "" : "s"}
                      {roundSessions.length > 0 ? ` · latest ${roundSessions[0].overallScore ?? "—"}%` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          )}
        </Card>

        <div className="space-y-4">
          <Card padding="md">
            <CardHeader title="Preparation" icon={Target} />
            {plan ? (
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-meta text-ink-muted">
                    <span>Plan completion</span>
                    <span>{plan.progress}%</span>
                  </div>
                  <ProgressBar value={plan.progress} />
                </div>
                <p className="text-secondary-size text-ink-secondary">
                  {plan.topics.length} topics · {plan.questions.length} questions
                </p>
                {plan.generalRoleBased && (
                  <p className="rounded-md border border-subtle bg-white/[0.02] p-2 text-meta text-ink-muted">
                    General role-based practice — not verified company-specific questions.
                  </p>
                )}
                <LinkButton href={`/interview-preparation/${profile.id}/plan`} variant="secondary" size="sm" icon={<FileText className="h-3.5 w-3.5" />}>
                  Open plan
                </LinkButton>
              </div>
            ) : (
              <p className="text-secondary-size text-ink-muted">
                No plan yet. Generate one to get a roadmap, topics and practice questions for this role.
              </p>
            )}
          </Card>

          <Card padding="md">
            <CardHeader title="Scores" description="Completed sessions only." />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-ink">
                  {analytics.scores.average === null ? "—" : `${analytics.scores.average}%`}
                </p>
                <p className="text-meta text-ink-muted">Average</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-brand">
                  {analytics.scores.latest === null ? "—" : `${analytics.scores.latest}%`}
                </p>
                <p className="text-meta text-ink-muted">Latest</p>
              </div>
            </div>
            {analytics.weakestTopics.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-meta font-semibold uppercase tracking-wider text-ink-muted">Weakest topics</p>
                <div className="flex flex-wrap gap-2">
                  {analytics.weakestTopics.map((topic) => (
                    <TopicPill key={topic.topic} label={topic.label} average={topic.average} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card padding="md">
        <CardHeader title="Practice history" description="Open any completed session for its full report." />
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-4 text-secondary-size text-ink-muted">
            No sessions yet. Start a practice set or a mock interview above.
          </p>
        ) : (
          <ul className="divide-y divide-subtle">
            {sessions.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-body text-ink">
                    {entry.sessionType === "mock" ? "Mock interview" : "Practice set"} ·{" "}
                    {entry.answers.length} answer{entry.answers.length === 1 ? "" : "s"}
                  </p>
                  <p className="text-label text-ink-secondary">{new Date(entry.startedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status === "completed" ? "completed" : entry.status.replace("_", " ")} />
                  {entry.overallScore !== null && <Badge tone="brand">{entry.overallScore}%</Badge>}
                  {entry.status === "completed" ? (
                    <LinkButton href={`/interview-preparation/sessions/${entry.id}/report`} size="sm" variant="secondary">
                      Report
                    </LinkButton>
                  ) : (
                    <LinkButton href={`/interview-preparation/sessions/${entry.id}`} size="sm" variant="secondary">
                      Resume
                    </LinkButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {profile.jobDescription && (
        <Card padding="md">
          <CardHeader title="Job description" description="Used to ground generated questions." />
          <p className="whitespace-pre-wrap text-secondary-size text-ink-secondary">{profile.jobDescription}</p>
        </Card>
      )}
    </div>
  );
}

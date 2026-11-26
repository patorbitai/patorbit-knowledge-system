import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Route, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { interviewProfileService, InterviewNotFoundError } from "@/services/interview-profile.service";
import { interviewPlanService } from "@/services/interview-plan.service";
import { categoryLabel, interviewTypeLabel } from "@/lib/interview/constants";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, LinkButton, ProgressBar } from "@/components/hub/interview/ui";
import { GeneratePlanButton, StartSessionButton } from "@/components/hub/interview/SessionButtons";

export const dynamic = "force-dynamic";

const PRIORITY_TONE = { high: "danger", medium: "warning", low: "neutral" } as const;

export default async function PreparationPlanPage({
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

  const plan = await interviewPlanService.getLatest(identity.id, profileId);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link
          href={`/interview-preparation/${profile.id}`}
          className="inline-flex items-center gap-1.5 text-label text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {profile.companyName} · {profile.jobTitle}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-page-title text-ink">Preparation plan</h1>
            <p className="mt-1 text-secondary-size text-ink-secondary">
              {interviewTypeLabel(profile.interviewType)} · grounded in your profile and this role
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GeneratePlanButton
              profileId={profile.id}
              label={plan ? "Regenerate" : "Generate plan"}
              variant={plan ? "secondary" : "primary"}
            />
            <StartSessionButton profileId={profile.id} sessionType="practice" label="Start practice" variant="secondary" />
          </div>
        </div>
      </div>

      {!plan ? (
        <EmptyState
          title="No preparation plan yet"
          description="Generate a plan to get a roadmap, prioritised topics and role-specific practice questions. Plans are stored per profile, so you can come back to them."
          actions={<GeneratePlanButton profileId={profile.id} label="Generate preparation plan" />}
        />
      ) : (
        <>
          {plan.generalRoleBased && (
            <p className="rounded-md border border-subtle bg-white/[0.02] px-3 py-2 text-meta text-ink-muted">
              These are general role-based practice questions generated from your profile — Patorbit has no
              verified company interview process for this role, so nothing here is claimed to be a real
              company question.
            </p>
          )}

          <Card padding="md">
            <CardHeader title="Summary" icon={Sparkles} />
            <p className="whitespace-pre-wrap text-secondary-size text-ink-secondary">{plan.summary}</p>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-meta text-ink-muted">
                <span>Plan completion</span>
                <span>{plan.progress}%</span>
              </div>
              <ProgressBar value={plan.progress} />
            </div>
          </Card>

          <Card padding="md">
            <CardHeader title="Roadmap" icon={Route} />
            <ol className="space-y-3">
              {plan.roadmap.map((step, index) => (
                <li key={`${step.step}-${index}`} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-meta font-semibold text-brand">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-body font-medium text-ink">{step.step}</p>
                    {step.detail && <p className="mt-0.5 text-secondary-size text-ink-secondary">{step.detail}</p>}
                    {step.effort && <p className="mt-0.5 text-meta text-ink-muted">{step.effort}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card padding="md">
            <CardHeader title="Topics to cover" description="Prioritised from the role requirements." />
            <ul className="grid gap-2 sm:grid-cols-2">
              {plan.topics.map((topic) => (
                <li key={topic.name} className="rounded-lg border border-subtle bg-surface-raised p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-body font-medium text-ink">{topic.name}</p>
                    <Badge tone={PRIORITY_TONE[topic.priority]}>{topic.priority}</Badge>
                  </div>
                  <p className="mt-1 text-meta text-ink-muted">{categoryLabel(topic.category)}</p>
                  {topic.why && <p className="mt-1 text-secondary-size text-ink-secondary">{topic.why}</p>}
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <CardHeader title="Practice questions" description="Open a question for its answer framework and follow-ups." />
            <ul className="space-y-2">
              {plan.questions.map((question, index) => (
                <li key={question.id ?? `${index}-${question.question.slice(0, 20)}`}>
                  <details className="rounded-lg border border-subtle bg-surface-raised p-3">
                    <summary className="cursor-pointer text-body text-ink">
                      {question.question}
                      <span className="ml-2 text-meta text-ink-muted">
                        {categoryLabel(question.category)} · {question.difficulty}
                      </span>
                    </summary>
                    {question.answerFramework && (
                      <div className="mt-2">
                        <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">Answer framework</p>
                        <p className="mt-1 whitespace-pre-wrap text-secondary-size text-ink-secondary">{question.answerFramework}</p>
                      </div>
                    )}
                    {question.followUps.length > 0 && (
                      <div className="mt-2">
                        <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">Likely follow-ups</p>
                        <ul className="mt-1 list-disc pl-5 text-secondary-size text-ink-secondary">
                          {question.followUps.map((followUp) => (
                            <li key={followUp}>{followUp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          </Card>

          {plan.projectDiscussionTopics.length > 0 && (
            <Card padding="md">
              <CardHeader title="Project discussion" description="Talk about work you actually did — the plan does not invent projects." />
              <ul className="list-disc space-y-1 pl-5 text-secondary-size text-ink-secondary">
                {plan.projectDiscussionTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </Card>
          )}

          {plan.practiceSequence.length > 0 && (
            <Card padding="md">
              <CardHeader title="Recommended sequence" />
              <ol className="list-decimal space-y-1 pl-5 text-secondary-size text-ink-secondary">
                {plan.practiceSequence.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <StartSessionButton profileId={profile.id} sessionType="practice" label="Start practice" />
                <StartSessionButton profileId={profile.id} sessionType="mock" label="Start mock interview" variant="secondary" />
                <LinkButton href={`/interview-preparation/${profile.id}`} variant="ghost">
                  Back to profile
                </LinkButton>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

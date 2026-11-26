import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Trophy, TriangleAlert } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { interviewSessionService } from "@/services/interview-session.service";
import { InterviewNotFoundError } from "@/services/interview-profile.service";
import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/interview/constants";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/hub/interview/ui";
import { StartSessionButton } from "@/components/hub/interview/SessionButtons";

export const dynamic = "force-dynamic";

const DIMENSION_LABELS: Record<string, string> = {
  technicalAccuracy: "Technical accuracy",
  conceptualUnderstanding: "Conceptual understanding",
  completeness: "Completeness",
  problemSolving: "Problem solving",
  practicalApplication: "Practical application",
  communicationClarity: "Communication clarity",
};

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const identity = await identityService.ensureProfessionalIdentity(session.user.id);

  let practice;
  try {
    practice = await interviewSessionService.get(identity.id, sessionId);
  } catch (err) {
    if (err instanceof InterviewNotFoundError) notFound();
    throw err;
  }

  if (practice.status !== "completed") {
    redirect(`/interview-preparation/sessions/${sessionId}`);
  }

  const profile = await prisma.interviewProfile.findUnique({
    where: { id: practice.interviewProfileId },
    select: { id: true, companyName: true, jobTitle: true },
  });
  const report = practice.report;
  const categories = Array.from(new Set(practice.answers.map((answer) => answer.category))).slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link
          href={profile ? `/interview-preparation/${profile.id}` : "/interview-preparation"}
          className="inline-flex items-center gap-1.5 text-label text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {profile ? `${profile.companyName} · ${profile.jobTitle}` : "Interview Preparation"}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-page-title text-ink">Performance report</h1>
            <p className="mt-1 text-secondary-size text-ink-secondary">
              {practice.sessionType === "mock" ? "Mock interview" : "Practice set"} completed{" "}
              {practice.completedAt ? new Date(practice.completedAt).toLocaleString() : ""} ·{" "}
              {practice.answers.length} answers
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tabular-nums text-brand">
              {practice.overallScore === null ? "—" : `${practice.overallScore}%`}
            </p>
            <p className="text-meta text-ink-muted">Overall</p>
          </div>
        </div>
      </div>

      {report?.generalRoleBased && (
        <p className="flex items-start gap-2 rounded-md border border-subtle bg-white/[0.02] px-3 py-2 text-meta text-ink-muted">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Questions are general role-based practice generated from your profile — not verified company
          interview questions.
        </p>
      )}

      {report?.overview && (
        <Card padding="md">
          <CardHeader title="Summary" icon={Trophy} />
          <p className="whitespace-pre-wrap text-secondary-size text-ink-secondary">{report.overview}</p>
        </Card>
      )}

      <div className={report ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
        <Card padding="md">
          <CardHeader title="Dimension scores" description="Averaged from your evaluated answers." />
          <div className="space-y-3">
            {Object.entries(practice.dimensionAverages).map(([key, value]) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-label">
                  <span className="text-ink-secondary">{DIMENSION_LABELS[key] ?? key}</span>
                  <span className="font-semibold tabular-nums text-ink">{value}/5</span>
                </div>
                <ProgressBar value={(value / 5) * 100} label={DIMENSION_LABELS[key] ?? key} />
              </div>
            ))}
          </div>
        </Card>

        {report && (
        <div className="space-y-4">
          {report.strengths.length > 0 && (
            <Card padding="md">
              <CardHeader title="Strengths" />
              <ul className="list-disc space-y-1 pl-5 text-secondary-size text-ink-secondary">
                {report.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          )}
          {report.improvements.length > 0 && (
            <Card padding="md">
              <CardHeader title="Improve next" />
              <ul className="list-disc space-y-1 pl-5 text-secondary-size text-ink-secondary">
                {report.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        )}
      </div>

      {report && (report.strongestTopics.length > 0 || report.weakestTopics.length > 0) && (
        <Card padding="md">
          <CardHeader title="Topics" description="Derived from the topics your answers were evaluated on." />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-meta font-semibold uppercase tracking-wider text-ink-muted">Strongest</p>
              <div className="flex flex-wrap gap-2">
                {report.strongestTopics.map((topic) => (
                  <Badge key={topic} tone="success">{categoryLabel(topic)}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-meta font-semibold uppercase tracking-wider text-ink-muted">Weakest</p>
              <div className="flex flex-wrap gap-2">
                {report.weakestTopics.map((topic) => (
                  <Badge key={topic} tone="warning">{categoryLabel(topic)}</Badge>
                ))}
              </div>
            </div>
          </div>
          {report.recommendations.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-secondary-size text-ink-secondary">
              {report.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {profile && categories.length > 0 && (
            <div className="mt-4">
              <StartSessionButton
                profileId={profile.id}
                categories={categories}
                label="Practise these topics again"
                variant="secondary"
              />
            </div>
          )}
        </Card>
      )}

      <Card padding="md">
        <CardHeader title="Answer by answer" description="Scores and evidence recorded at the time of each answer." />
        <ol className="space-y-3">
          {practice.answers.map((answer, index) => (
            <li key={`${answer.questionId}-${index}`} className="rounded-lg border border-subtle bg-surface-raised p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-body font-medium text-ink">
                  {index + 1}. {answer.questionText}
                </p>
                <Badge tone="brand">{categoryLabel(answer.category)}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-secondary-size text-ink-secondary">{answer.answer}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {Object.entries(answer.evaluation.dimensions).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-subtle p-2">
                    <div className="flex items-center justify-between text-meta">
                      <span className="text-ink-secondary">{DIMENSION_LABELS[key] ?? key}</span>
                      <span className="font-semibold tabular-nums text-ink">{value.score}/5</span>
                    </div>
                    {value.evidence && <p className="mt-1 text-meta text-ink-muted">{value.evidence}</p>}
                  </div>
                ))}
              </div>
              {answer.evaluation.idealAnswerFramework && (
                <p className="mt-3 whitespace-pre-wrap rounded-md border border-subtle bg-white/[0.02] p-2 text-meta text-ink-secondary">
                  <span className="font-semibold text-ink">Strong answer covers: </span>
                  {answer.evaluation.idealAnswerFramework}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

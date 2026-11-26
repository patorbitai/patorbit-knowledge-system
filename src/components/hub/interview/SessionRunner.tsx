"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, HelpCircle, Pause, Play, Save, Send, Square } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/interview/client";
import { categoryLabel } from "@/lib/interview/constants";

type Dimension = { score: number; evidence: string };
type Evaluation = {
  dimensions: Record<string, Dimension>;
  strengths: string[];
  improvements: string[];
  idealAnswerFramework: string;
  followUpQuestion: string | null;
  topic: string;
};
type Question = { id: string; category: string; difficulty: string; question: string; answerFramework: string; followUps: string[] };
type Answer = { questionId: string; questionText: string; category: string; answer: string; answeredAt: string; evaluation: Evaluation };
export type SessionState = {
  id: string;
  interviewProfileId: string;
  sessionType: string;
  status: string;
  questions: Question[];
  answers: Answer[];
  overallScore: number | null;
};

const DIMENSION_LABELS: Record<string, string> = {
  technicalAccuracy: "Technical accuracy",
  conceptualUnderstanding: "Conceptual understanding",
  completeness: "Completeness",
  problemSolving: "Problem solving",
  practicalApplication: "Practical application",
  communicationClarity: "Communication clarity",
};

export default function SessionRunner({
  initialSession,
  heading,
}: {
  initialSession: SessionState;
  heading: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<Record<string, string>>({});
  const [savedQuestions, setSavedQuestions] = useState<Record<string, boolean>>({});

  const answeredIds = useMemo(() => new Set(session.answers.map((answer) => answer.questionId)), [session.answers]);
  const currentQuestion = session.questions.find((question) => !answeredIds.has(question.id)) ?? null;
  const currentAnswer = currentQuestion
    ? session.answers.find((answer) => answer.questionId === currentQuestion.id) ?? null
    : null;
  const lastAnswer = session.answers[session.answers.length - 1] ?? null;
  const isMock = session.sessionType === "mock";

  async function submitAnswer() {
    if (!currentQuestion || !draft.trim()) return;
    setBusy("answer");
    setError(null);
    try {
      const data = await apiFetch<{ session: SessionState }>(
        `/api/interview/sessions/${session.id}/answer`,
        { method: "POST", body: JSON.stringify({ questionId: currentQuestion.id, answer: draft.trim() }) },
      );
      setSession(data.session);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit that answer.");
    } finally {
      setBusy(null);
    }
  }

  async function explain() {
    if (!currentQuestion) return;
    setBusy("explain");
    setError(null);
    try {
      const data = await apiFetch<{ explanation: string }>(
        `/api/interview/sessions/${session.id}/explain`,
        { method: "POST", body: JSON.stringify({ questionId: currentQuestion.id }) },
      );
      setExplanation((current) => ({ ...current, [currentQuestion.id]: data.explanation }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load an explanation.");
    } finally {
      setBusy(null);
    }
  }

  async function saveQuestion() {
    if (!currentQuestion) return;
    setBusy("save");
    try {
      await apiFetch("/api/interview/saved-questions", {
        method: "POST",
        body: JSON.stringify({
          interviewProfileId: session.interviewProfileId,
          sessionId: session.id,
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty,
          text: currentQuestion.question,
          suggestedAnswer: currentQuestion.answerFramework || null,
        }),
      });
      setSavedQuestions((current) => ({ ...current, [currentQuestion.id]: true }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save that question.");
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(status: "in_progress" | "paused" | "abandoned") {
    setBusy(status);
    setError(null);
    try {
      const data = await apiFetch<{ session: SessionState }>(`/api/interview/sessions/${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSession(data.session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the session.");
    } finally {
      setBusy(null);
    }
  }

  async function finish() {
    setBusy("complete");
    setError(null);
    try {
      await apiFetch(`/api/interview/sessions/${session.id}/complete`, { method: "POST" });
      router.push(`/interview-preparation/sessions/${session.id}/report`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not finish the session.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-page-title text-ink">{heading}</h1>
          <p className="mt-1 text-secondary-size text-ink-secondary">
            {isMock ? "Mock interview" : "Practice set"} · {session.answers.length} of {session.questions.length} answered
            {session.status === "paused" ? " · Paused" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {session.status === "paused" ? (
            <Button variant="secondary" onClick={() => changeStatus("in_progress")} loading={busy === "in_progress"} icon={<Play className="h-4 w-4" />}>
              Resume
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => changeStatus("paused")} loading={busy === "paused"} icon={<Pause className="h-4 w-4" />}>
              Pause
            </Button>
          )}
          <Button
            onClick={finish}
            loading={busy === "complete"}
            disabled={session.answers.length === 0}
            icon={<Square className="h-4 w-4" />}
          >
            Finish &amp; get report
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-secondary-size text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="md">
          {currentQuestion ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{categoryLabel(currentQuestion.category)}</Badge>
                <Badge tone="neutral">{currentQuestion.difficulty}</Badge>
                {isMock && <Badge tone="info">Mock</Badge>}
              </div>
              <p className="text-card leading-relaxed text-ink">{currentQuestion.question}</p>

              <div>
                <label htmlFor="answer" className="text-label text-ink-secondary">
                  Your answer
                </label>
                <Textarea
                  id="answer"
                  rows={7}
                  className="mt-1.5"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Structure your answer as you would say it in the interview."
                  disabled={session.status === "paused"}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={submitAnswer}
                  loading={busy === "answer"}
                  disabled={!draft.trim() || session.status === "paused"}
                  icon={<Send className="h-4 w-4" />}
                >
                  Submit answer
                </Button>
                <Button variant="ghost" onClick={explain} loading={busy === "explain"} icon={<HelpCircle className="h-4 w-4" />}>
                  Explain this question
                </Button>
                <Button
                  variant="ghost"
                  onClick={saveQuestion}
                  loading={busy === "save"}
                  disabled={savedQuestions[currentQuestion.id]}
                  icon={<Save className="h-4 w-4" />}
                >
                  {savedQuestions[currentQuestion.id] ? "Saved" : "Save question"}
                </Button>
              </div>

              {explanation[currentQuestion.id] && (
                <div className="rounded-lg border border-subtle bg-white/[0.02] p-3">
                  <p className="mb-1 text-meta font-semibold uppercase tracking-wider text-ink-muted">How to approach it</p>
                  <p className="whitespace-pre-wrap text-secondary-size text-ink-secondary">
                    {explanation[currentQuestion.id]}
                  </p>
                </div>
              )}

              {lastAnswer && (
                <div className="rounded-lg border border-subtle bg-surface-raised p-4">
                  <p className="mb-2 flex items-center gap-2 text-label font-semibold text-ink">
                    <CheckCircle2 className="h-4 w-4 text-success" /> Evaluation of your last answer
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(lastAnswer.evaluation.dimensions).map(([key, value]) => (
                      <div key={key} className="rounded-md border border-subtle p-2">
                        <div className="flex items-center justify-between text-label">
                          <span className="text-ink-secondary">{DIMENSION_LABELS[key] ?? key}</span>
                          <span className="font-semibold tabular-nums text-ink">{value.score}/5</span>
                        </div>
                        {value.evidence && <p className="mt-1 text-meta text-ink-muted">{value.evidence}</p>}
                      </div>
                    ))}
                  </div>
                  {lastAnswer.evaluation.strengths.length > 0 && (
                    <div className="mt-3">
                      <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">Strengths</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-secondary-size text-ink-secondary">
                        {lastAnswer.evaluation.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastAnswer.evaluation.improvements.length > 0 && (
                    <div className="mt-3">
                      <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">Improve</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-secondary-size text-ink-secondary">
                        {lastAnswer.evaluation.improvements.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastAnswer.evaluation.idealAnswerFramework && (
                    <div className="mt-3">
                      <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">A strong answer covers</p>
                      <p className="mt-1 whitespace-pre-wrap text-secondary-size text-ink-secondary">
                        {lastAnswer.evaluation.idealAnswerFramework}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-success" />
              <p className="text-card text-ink">All questions answered</p>
              <p className="text-secondary-size text-ink-secondary">
                Finish the session to generate your performance report.
              </p>
              <Button onClick={finish} loading={busy === "complete"}>
                Finish &amp; get report
              </Button>
            </div>
          )}
        </Card>

        <Card padding="md">
          <p className="mb-2 flex items-center gap-2 text-label font-semibold text-ink">
            <BookOpen className="h-4 w-4" /> Questions
          </p>
          <ol className="space-y-2">
            {session.questions.map((question, index) => {
              const answered = answeredIds.has(question.id);
              return (
                <li key={question.id} className="rounded-md border border-subtle p-2 text-label">
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className={
                        answered
                          ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success"
                          : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-ink-muted"
                      }
                    >
                      {answered ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-ink-secondary">{question.question}</p>
                      <p className="mt-0.5 text-meta text-ink-muted">{categoryLabel(question.category)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {currentAnswer && (
            <p className="mt-3 text-meta text-ink-muted">
              Your answer: {currentAnswer.answer.slice(0, 120)}
              {currentAnswer.answer.length > 120 ? "…" : ""}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

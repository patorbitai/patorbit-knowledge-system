"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Play, Sparkles, Trash2, Layers } from "lucide-react";
import Button from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/interview/client";
import { INTERVIEW_TYPES } from "@/lib/interview/constants";

type Round = { id: string; roundName: string; roundType: string; status: string };

export default function ProfileActions({
  profileId,
  rounds,
  hasPlan,
}: {
  profileId: string;
  rounds: Round[];
  hasPlan: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRound, setShowRound] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [roundType, setRoundType] = useState("technical_interview");
  const [roundDate, setRoundDate] = useState("");

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const generatePlan = () =>
    run("plan", async () => {
      await apiFetch(`/api/interview/profiles/${profileId}/plan`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      router.push(`/interview-preparation/${profileId}/plan`);
    });

  const startSession = (sessionType: "practice" | "mock") =>
    run(sessionType, async () => {
      const data = await apiFetch<{ session: { id: string } }>(
        `/api/interview/profiles/${profileId}/sessions`,
        { method: "POST", body: JSON.stringify({ sessionType }) },
      );
      router.push(`/interview-preparation/sessions/${data.session.id}`);
    });

  const addRound = () =>
    run("round", async () => {
      await apiFetch(`/api/interview/profiles/${profileId}/rounds`, {
        method: "POST",
        body: JSON.stringify({
          roundName: roundName.trim() || `Round ${rounds.length + 1}`,
          roundType,
          interviewDate: roundDate ? new Date(roundDate).toISOString() : null,
        }),
      });
      setShowRound(false);
      setRoundName("");
      setRoundDate("");
      router.refresh();
    });

  const removeProfile = () =>
    run("delete", async () => {
      if (!window.confirm("Delete this interview profile and all its rounds, plans and sessions?")) return;
      await apiFetch(`/api/interview/profiles/${profileId}`, { method: "DELETE" });
      router.push("/interview-preparation");
    });

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-secondary-size text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={generatePlan} loading={busy === "plan"} icon={<Sparkles className="h-4 w-4" />}>
          {hasPlan ? "Regenerate plan" : "Generate preparation plan"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => startSession("practice")}
          loading={busy === "practice"}
          icon={<Play className="h-4 w-4" />}
        >
          Start practice
        </Button>
        <Button
          variant="secondary"
          onClick={() => startSession("mock")}
          loading={busy === "mock"}
          icon={<Play className="h-4 w-4" />}
        >
          Start mock interview
        </Button>
        <Button variant="ghost" onClick={() => setShowRound((value) => !value)} icon={<Layers className="h-4 w-4" />}>
          Add round
        </Button>
        <Button variant="ghost" onClick={removeProfile} loading={busy === "delete"} icon={<Trash2 className="h-4 w-4" />}>
          Delete
        </Button>
      </div>

      {showRound && (
        <div className="rounded-lg border border-subtle bg-surface-raised p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Round name" htmlFor="roundName">
              <Input
                id="roundName"
                value={roundName}
                onChange={(event) => setRoundName(event.target.value)}
                placeholder={`Round ${rounds.length + 1}`}
              />
            </Field>
            <Field label="Round type" htmlFor="roundType">
              <Select id="roundType" value={roundType} onChange={(event) => setRoundType(event.target.value)}>
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" htmlFor="roundDate">
              <Input id="roundDate" type="datetime-local" value={roundDate} onChange={(event) => setRoundDate(event.target.value)} />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={addRound} loading={busy === "round"} icon={<Plus className="h-3.5 w-3.5" />}>
              Add round
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

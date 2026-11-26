"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/interview/client";

/** Starts a practice or mock session and opens the workspace. */
export function StartSessionButton({
  profileId,
  sessionType = "practice",
  categories = [],
  label,
  variant = "primary",
  size = "md",
  roundId,
}: {
  profileId: string;
  sessionType?: "practice" | "mock";
  categories?: string[];
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  roundId?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ session: { id: string } }>(
        `/api/interview/profiles/${profileId}/sessions`,
        { method: "POST", body: JSON.stringify({ sessionType, categories, roundId: roundId ?? null }) },
      );
      router.push(`/interview-preparation/sessions/${data.session.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start a session.");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button onClick={start} loading={busy} variant={variant} size={size} icon={<Play className="h-4 w-4" />}>
        {label}
      </Button>
      {error && <span className="text-meta text-danger">{error}</span>}
    </span>
  );
}

/** Generates (or regenerates) the preparation plan, then opens it. */
export function GeneratePlanButton({
  profileId,
  label = "Generate preparation plan",
  variant = "primary",
}: {
  profileId: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/interview/profiles/${profileId}/plan`, { method: "POST", body: JSON.stringify({}) });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate a plan.");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button onClick={generate} loading={busy} variant={variant} icon={<Sparkles className="h-4 w-4" />}>
        {label}
      </Button>
      {error && <span className="text-meta text-danger">{error}</span>}
    </span>
  );
}

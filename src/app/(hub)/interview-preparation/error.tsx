"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function InterviewPreparationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[interview-preparation] render error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card padding="lg" className="text-center">
        <h1 className="text-page-title text-ink">Interview Preparation could not load</h1>
        <p className="mx-auto mt-2 max-w-md text-secondary-size text-ink-secondary">
          Something went wrong while loading your interview workspace. Your data is safe — try again.
        </p>
        <div className="mt-5 flex justify-center">
          <Button onClick={reset}>Try again</Button>
        </div>
      </Card>
    </div>
  );
}

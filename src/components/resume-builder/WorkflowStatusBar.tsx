"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { deriveWorkflowState, getCurrentStep, type WorkflowStepId } from "@/lib/workflow-state";
import { clsx } from "clsx";
import { useCallback } from "react";

type StepId = WorkflowStepId;

interface Step {
  id: StepId;
  label: string;
  shortLabel: string;
  /** Tooltip shown on hover */
  hint: string;
}

const STEPS: Step[] = [
  { id: "resume", label: "Resume Ready", shortLabel: "Resume", hint: "Build your resume" },
  { id: "job", label: "Job Analyzed", shortLabel: "Job", hint: "Add a job description" },
  { id: "match", label: "Matched", shortLabel: "Match", hint: "Analyze your fit" },
  { id: "tailor", label: "Tailored", shortLabel: "Tailor", hint: "Tailor your resume" },
  { id: "export", label: "Exported", shortLabel: "Export", hint: "Export final resume" },
];

/**
 * Handle click on a workflow step.
 * Navigates to or focuses the appropriate feature.
 */
function useStepAction() {
  const jobProfile = useResumeBuilder((s) => s.jobProfile);
  const qualificationMatch = useResumeBuilder((s) => s.qualificationMatch);
  const resume = useResumeBuilder((s) => s.resume);
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const activeJobApplication = useResumeBuilder((s) => s.activeJobApplication);

  // Use persisted job application data as fallback when session-level state is cleared
  // (e.g., after page reload or job switch).
  const hasJobFromApplication = !!activeJobApplication?.jobDescription;
  const hasMatchFromApplication = activeJobApplication?.matchScore != null;

  // Match-version staleness detection: if the match was computed for a different
  // resume than the currently active one, the match may no longer be accurate.
  const matchVersionStale = !!(
    activeJobApplication?.matchedResumeId &&
    activeJobApplication.matchedResumeId !== activeResumeId
  );

  // Export-version awareness: export is complete only if the currently active
  // resume is the same one that was exported.
  const exportVersionCurrent = !!(
    activeJobApplication?.exportedResumeId &&
    activeJobApplication.exportedResumeId === activeResumeId
  );

  // The workflow state reflects the CURRENT active resume + job combination.
  const jobStepData = jobProfile || (hasJobFromApplication ? { title: activeJobApplication?.title || "" } as any : null);
  const effectiveMatch = matchVersionStale ? null : qualificationMatch;
  const matchStepData = effectiveMatch || (hasMatchFromApplication && !matchVersionStale ? { id: "match", summary: { total: 0, proven: 0, related: 0, communicationGap: 0, missing: 0 } } as any : null);

  const state = deriveWorkflowState(
    resume,
    jobStepData,
    matchStepData,
    exportVersionCurrent,
  );
  const currentStep = getCurrentStep(state);

  const handleStepClick = useCallback((stepId: StepId) => {
    // For the current step or any future step, scroll to / focus the relevant area
    switch (stepId) {
      case "resume":
        // Focus the resume editor — navigate to resume builder if not already there
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/resume-builder")) {
          window.location.href = "/resume-builder";
        }
        break;
      case "job":
        // The JD input is in the AI Copilot — it's already visible in the right panel
        // Just scroll to it if needed
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/resume-builder")) {
          window.location.href = "/resume-builder";
        }
        break;
      case "match":
        // Job Match panel is in the AI Copilot
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/resume-builder")) {
          window.location.href = "/resume-builder";
        }
        break;
      case "tailor":
        // Open the Tailor modal — dispatch a custom event that the Resume Builder listens for
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("patorbit:open-tailor"));
        }
        break;
      case "export":
        // Open the Export modal — dispatch a custom event
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("patorbit:open-export"));
        }
        break;
    }
  }, []);

  return { state, currentStep, handleStepClick };
}

export function WorkflowStatusBar() {
  const { state, currentStep, handleStepClick } = useStepAction();

  const completedCount = STEPS.filter((step) => state[step.id]).length;
  const currentLabel =
    currentStep === "complete"
      ? "Complete"
      : STEPS.find((s) => s.id === currentStep)?.shortLabel ?? "";

  // Subtle context indicator (§2): five dots + a hairline, plus a tiny
  // "3/5 · Match" caption. Clickable steps stay, chrome does not.
  return (
    <div className="flex items-center gap-2 px-1 py-1" role="navigation" aria-label="Workflow progress">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isComplete = state[step.id];
          const isCurrent = currentStep !== "complete" && step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => handleStepClick(step.id)}
                title={isComplete ? step.label : step.hint}
                aria-label={step.label}
                className="p-1 cursor-pointer rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
              >
                <span
                  className={clsx(
                    "block h-1.5 w-1.5 rounded-full transition-colors",
                    isComplete && "bg-cyan-500",
                    isComplete && isCurrent && "bg-cyan-500",
                    !isComplete && isCurrent && "bg-cyan-500/35 ring-1 ring-cyan-500/70 ring-offset-[1.5px] ring-offset-white dark:ring-offset-[#070d18]",
                    !isComplete && !isCurrent && "bg-gray-300 dark:bg-slate-600",
                  )}
                />
              </button>
              {i < STEPS.length - 1 && (
                <span className="w-3 h-px bg-gray-200 dark:bg-white/[0.1] shrink-0" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
      <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
        {completedCount}/{STEPS.length} · {currentLabel}
      </span>
    </div>
  );
}

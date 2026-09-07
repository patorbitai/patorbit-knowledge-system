"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { deriveWorkflowState, getCurrentStep, type WorkflowStepId } from "@/lib/workflow-state";
import { clsx } from "clsx";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
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

  // Count completed steps
  const completedCount = STEPS.filter((step) => state[step.id]).length;

  return (
    <div className="flex items-center gap-1 px-2 py-1" role="navigation" aria-label="Workflow progress">
      {STEPS.map((step, i) => {
        const isComplete = state[step.id];
        const isCurrent = currentStep !== "complete" && step.id === currentStep;
        const isClickable = true; // Always clickable for navigation

        return (
          <div key={step.id} className="flex items-center gap-1">
            {/* Step indicator */}
            <button
              onClick={() => handleStepClick(step.id)}
              disabled={!isClickable}
              title={isComplete ? step.label : step.hint}
              className={clsx(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer",
                isComplete && "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
                isCurrent && "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20",
                !isComplete && !isCurrent && "text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-white/[0.04]",
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{step.shortLabel}</span>
            </button>

            {/* Arrow between steps */}
            {i < STEPS.length - 1 && (
              <ArrowRight className="w-2.5 h-2.5 text-gray-300 dark:text-slate-600 shrink-0" />
            )}
          </div>
        );
      })}

      {/* Summary text */}
      <span className="ml-2 text-[10px] text-gray-400 dark:text-slate-500 hidden md:inline">
        {completedCount}/{STEPS.length}
      </span>
    </div>
  );
}

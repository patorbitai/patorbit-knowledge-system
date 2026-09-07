"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { clsx } from "clsx";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

type StepId = "resume" | "job" | "match" | "tailor" | "export";

interface Step {
  id: StepId;
  label: string;
  shortLabel: string;
}

const STEPS: Step[] = [
  { id: "resume", label: "Resume Ready", shortLabel: "Resume" },
  { id: "job", label: "Job Analyzed", shortLabel: "Job" },
  { id: "match", label: "Matched", shortLabel: "Match" },
  { id: "tailor", label: "Tailored", shortLabel: "Tailor" },
  { id: "export", label: "Exported", shortLabel: "Export" },
];

function getWorkflowState(resume: any, jobProfile: any, qualificationMatch: any, jobDescription: string) {
  const hasResume = resume && (
    resume.summary ||
    (resume.experience && resume.experience.length > 0) ||
    (resume.skills && resume.skills.length > 0)
  );
  const hasJob = !!jobProfile;
  const hasMatch = !!qualificationMatch;
  const hasJobDescription = !!jobDescription?.trim();

  return {
    resume: hasResume,
    job: hasJob,
    match: hasMatch,
    tailor: false, // No tailored resume detected in current session
    export: false, // No export detection
  };
}

export function WorkflowStatusBar() {
  const resume = useResumeBuilder((s) => s.resume);
  const jobProfile = useResumeBuilder((s) => s.jobProfile);
  const qualificationMatch = useResumeBuilder((s) => s.qualificationMatch);
  const jobDescription = useResumeBuilder((s) => s.jobDescription);

  const state = getWorkflowState(resume, jobProfile, qualificationMatch, jobDescription);

  // Find the first incomplete step (the "current" step)
  const currentStepIndex = STEPS.findIndex((step) => !state[step.id]);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : STEPS.length;

  // Count completed steps
  const completedCount = STEPS.filter((step) => state[step.id]).length;

  return (
    <div className="flex items-center gap-1 px-2 py-1">
      {STEPS.map((step, i) => {
        const isComplete = state[step.id];
        const isCurrent = i === currentStep && currentStep < STEPS.length;
        const isPast = i < currentStep;

        return (
          <div key={step.id} className="flex items-center gap-1">
            {/* Step indicator */}
            <div
              className={clsx(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors",
                isComplete && "text-emerald-600 dark:text-emerald-400",
                isCurrent && "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10",
                !isComplete && !isCurrent && "text-gray-400 dark:text-slate-500",
              )}
              title={step.label}
            >
              {isComplete ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{step.shortLabel}</span>
            </div>

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

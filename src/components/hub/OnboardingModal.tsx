"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { ProfessionalIdentityEditor, type ProfileData } from "./ProfessionalIdentityEditor";
import { useResumeBuilder } from "@/store/resume-builder";
import { track } from "@/lib/analytics";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Step = "welcome" | "identity" | "evidence" | "creating";

/* Compact input styling shared by the lightweight evidence step (mirrors
 * ProfessionalIdentityEditor so the two steps feel like one flow). */
const EVIDENCE_INPUT =
  "w-full rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50";

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Evidence step (§activation): one real role + a small skill set, captured
   * AFTER the essential identity step and BEFORE first-resume creation, so
   * the seeded master resume carries real evidence for the first analysis. */
  const [identityData, setIdentityData] = useState<ProfileData | null>(null);
  const [expPosition, setExpPosition] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState("");
  const [skillsText, setSkillsText] = useState("");
  /* §activation (M3): first-session evidence activation telemetry. Refs (not
   * trackOnce) keep each event at most once per prompt even under StrictMode. */
  const evidencePromptTrackedRef = useRef(false);
  const experienceStartedRef = useRef(false);
  // Funnel: the moment product onboarding actually begins (modal opens),
  // whether the user continues or skips. Ref-guarded for StrictMode.
  const startedRef = useRef(false);
  useEffect(() => {
    if (open && !startedRef.current) {
      startedRef.current = true;
      track("onboarding_started");
    }
  }, [open]);
  // §activation (M3): the first-evidence prompt was actually shown.
  useEffect(() => {
    if (step === "evidence" && !evidencePromptTrackedRef.current) {
      evidencePromptTrackedRef.current = true;
      track("first_evidence_prompt_viewed");
    }
  }, [step]);
  const createResume = useResumeBuilder((s) => s.createResume);
  const switchResume = useResumeBuilder((s) => s.switchResume);

  const evidenceSkills = skillsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const evidenceReady = Boolean(expPosition.trim() && expCompany.trim()) || evidenceSkills.length > 0;

  /* §activation (M3): the user began entering a real role — fired once. */
  const markExperienceStarted = useCallback(() => {
    if (experienceStartedRef.current) return;
    experienceStartedRef.current = true;
    track("first_experience_started");
  }, []);

  /* Identity Save → stash basics, move to the lightweight evidence step.
   * ProfessionalIdentityEditor persists profileData itself before onSave;
   * onboarding completion + first-resume creation happen after evidence. */
  const handleIdentitySaved = useCallback((data: ProfileData) => {
    setIdentityData(data);
    setStep("evidence");
  }, []);

  /* Evidence Finish (or Skip) → complete onboarding, then create the first
   * resume so the server seeds the master resume from the FULL profileData
   * (basics + this evidence) via the existing mapProfileToResume path. */
  const handleEvidenceFinish = useCallback(
    async (skipped: boolean) => {
      setError(null);
      setCreating(true);
      setStep("creating");

      try {
        const skills = skipped
          ? []
          : skillsText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
        const position = skipped ? "" : expPosition.trim();
        const company = skipped ? "" : expCompany.trim();
        const hasExperience = Boolean(position && company);

        const profileData: Record<string, unknown> = {};
        if (hasExperience) {
          profileData.experience = [
            {
              position,
              company,
              startDate: expStart.trim() || undefined,
              endDate: expCurrent ? undefined : expEnd.trim() || undefined,
              current: expCurrent || undefined,
              description: expDescription.trim() || undefined,
            },
          ];
        }
        if (skills.length > 0) profileData.skills = skills;

        const res = await fetch("/api/identity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileData, onboardingCompleted: true }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to save (HTTP ${res.status})`);
        }

        /* Funnel: same event as before, props distinguish a thin first
         * profile from one that carries real evidence. */
        track("profile_created", skipped ? { skipped: true } : { experience: hasExperience, skills: skills.length });

        /* §activation (M3): the evidence prompt outcome — saved vs genuinely
         * skipped. Only fires after the save succeeded, like profile_created. */
        if (skipped) {
          track("first_evidence_skipped");
        } else {
          if (hasExperience) track("first_experience_saved");
          if (skills.length > 0) track("first_skill_saved", { skills: skills.length });
        }

        const name = identityData?.fullName?.trim() || "My Resume";
        const newResumeId = createResume(name);
        switchResume(newResumeId);

        setTimeout(() => {
          window.location.href = "/overview";
        }, 800);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to complete setup");
        setCreating(false);
        setStep("evidence");
      }
    },
    [createResume, switchResume, identityData, expPosition, expCompany, expStart, expEnd, expCurrent, expDescription, skillsText],
  );

  const handleSkip = useCallback(async () => {
    setError(null);
    setCreating(true);
    setStep("creating");

    try {
      // Mark onboarding as completed — this must succeed before redirecting
      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save (HTTP ${res.status})`);
      }

      track("profile_created", { skipped: true });

      // Create a default resume
      const newResumeId = createResume("My Resume");
      switchResume(newResumeId);

      setTimeout(() => {
        window.location.href = "/overview";
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to complete setup");
      setCreating(false);
      setStep("identity");
    }
  }, [createResume, switchResume]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-2xl"
          >
            {/* Step: Welcome */}
            {step === "welcome" && (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Welcome to Patorbit</h1>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    Build your resume once. Keep your professional information organized. Tailor your resume to each job — without inventing experience.
                  </p>
                </div>
                <div className="flex flex-col gap-2 max-w-xs mx-auto text-left">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Create your professional identity</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Choose from 31 professional templates</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                    <span>Tailor to any job with AI assistance</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("identity")}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:opacity-90 text-sm font-medium text-white transition-all mx-auto"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step: Professional Identity */}
            {step === "identity" && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Your Professional Identity</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Tell us about yourself — this helps create a better first resume.</p>
                  </div>
                </div>
                <ProfessionalIdentityEditor
                  compact
                  showSkip
                  initialData={identityData ?? undefined}
                  onSave={handleIdentitySaved}
                  onSkip={handleSkip}
                />
              </div>
            )}

            {/* Step: Evidence — one real role + a small skill set (§activation).
                 Lightweight by design: enough real evidence to make the first
                 job analysis useful, never a full resume form. */}
            {step === "evidence" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Add your recent experience
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      One real role is enough to start — your first job match is compared against this evidence.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] px-3 py-2">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                    Only add what you&apos;ve actually done. Patorbit never invents experience, employers,
                    dates or skills — it only matches jobs against what you enter here.
                  </p>
                </div>

                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                  Add experience
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={expPosition}
                    onChange={(e) => {
                      markExperienceStarted();
                      setExpPosition(e.target.value);
                    }}
                    placeholder="Position (e.g. Senior Data Engineer)"
                    className={EVIDENCE_INPUT}
                  />
                  <input
                    type="text"
                    value={expCompany}
                    onChange={(e) => {
                      markExperienceStarted();
                      setExpCompany(e.target.value);
                    }}
                    placeholder="Company name"
                    className={EVIDENCE_INPUT}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={expStart}
                    onChange={(e) => {
                      markExperienceStarted();
                      setExpStart(e.target.value);
                    }}
                    placeholder="Start date (e.g. Mar 2021)"
                    className={EVIDENCE_INPUT}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={expEnd}
                      onChange={(e) => {
                        markExperienceStarted();
                        setExpEnd(e.target.value);
                      }}
                      disabled={expCurrent}
                      placeholder="End date (e.g. Feb 2025)"
                      className={EVIDENCE_INPUT}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400 whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expCurrent}
                        onChange={(e) => {
                          markExperienceStarted();
                          setExpCurrent(e.target.checked);
                        }}
                      />
                      I work here now
                    </label>
                  </div>
                </div>
                <textarea
                  value={expDescription}
                  onChange={(e) => {
                    markExperienceStarted();
                    setExpDescription(e.target.value);
                  }}
                  rows={3}
                  placeholder="What you did — a line or two in your own words (tools, projects, outcomes)"
                  className={`${EVIDENCE_INPUT} resize-none`}
                />

                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                  Add skills
                </p>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Skills you actually use (e.g. Python, SQL, Azure)"
                  className={EVIDENCE_INPUT}
                />

                <p className="text-[11px] text-gray-400 dark:text-slate-500">
                  Not much to add yet? Skip — your match stays honest until you add real evidence, and you
                  can add a role any time.
                </p>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => setStep("identity")}
                    className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
                  >
                    Back
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEvidenceFinish(true)}
                      className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={() => handleEvidenceFinish(false)}
                      disabled={!evidenceReady}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-white transition-all"
                    >
                      Finish profile
                    </button>
                  </div>
                </div>
                {!evidenceReady && (
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 -mt-2">
                    Add a position and company, or at least one skill, to finish — or skip and add evidence later.
                  </p>
                )}
              </div>
            )}

            {/* Step: Creating */}
            {step === "creating" && (
              <div className="p-8 text-center space-y-4">
                <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Creating your first resume...</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Setting up your workspace</p>
                </div>
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400 max-w-sm mx-auto">
                    {error}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

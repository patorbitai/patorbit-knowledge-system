"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { ProfessionalIdentityEditor, type ProfileData } from "./ProfessionalIdentityEditor";
import { useResumeBuilder } from "@/store/resume-builder";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Step = "welcome" | "identity" | "creating";

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createResume = useResumeBuilder((s) => s.createResume);
  const switchResume = useResumeBuilder((s) => s.switchResume);

  const handleIdentitySaved = useCallback(async (data: ProfileData) => {
    setStep("creating");
    setCreating(true);
    setError(null);

    try {
      // Save profile data AND mark onboarding as completed
      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileData: {
            fullName: data.fullName,
            headline: data.headline,
            email: data.email,
            phone: data.phone,
            location: data.location,
            linkedin: data.linkedin,
            github: data.github,
            website: data.website,
            summary: data.summary,
          },
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to save (HTTP ${res.status})`);
      }

      // Create first resume using the existing C30 flow
      const name = data.fullName || "My Resume";
      const newResumeId = createResume(name);
      switchResume(newResumeId);

      // Navigate to the builder
      setTimeout(() => {
        window.location.href = "/overview";
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create resume");
      setCreating(false);
      setStep("identity");
    }
  }, [createResume, switchResume]);

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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto">
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
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>Create your professional identity</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>Choose from 31 professional templates</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>Tailor to any job with AI assistance</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("identity")}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-sm font-medium text-white transition-all mx-auto"
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
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
                  onSave={handleIdentitySaved}
                  onSkip={handleSkip}
                />
              </div>
            )}

            {/* Step: Creating */}
            {step === "creating" && (
              <div className="p-8 text-center space-y-4">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
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

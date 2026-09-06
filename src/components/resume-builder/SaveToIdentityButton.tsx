"use client";

import { useState, useCallback } from "react";
import { UserCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { mapResumeToProfile } from "@/lib/resume-seeding";

/**
 * SaveToIdentityButton — manual sync from Resume → ProfessionalIdentity.
 *
 * Operates on the currently active resume and sends its data to /api/identity.
 * Does NOT run automatically on every edit — explicit user action only.
 */
export function SaveToIdentityButton() {
  const resume = useResumeBuilder((s) => s.resume);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (status === "saving") return;

    setStatus("saving");
    setErrorMsg(null);

    try {
      // Map resume to profile shape
      const profileData = mapResumeToProfile(resume);

      // Send to identity API
      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save to Professional Identity");
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to save");
      setTimeout(() => setStatus("idle"), 5000);
    }
  }, [resume, status]);

  // Don't show if resume is empty
  const hasContent = resume?.name || resume?.email || resume?.experience?.length || resume?.skills?.length;
  if (!hasContent) return null;

  return (
    <div className="relative group">
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        title="Save current resume data to Professional Identity"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
          status === "success"
            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30"
            : status === "error"
              ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-500/30"
              : "text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.08]"
        }`}
      >
        {status === "saving" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : status === "success" ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : status === "error" ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <UserCheck className="w-3 h-3" />
        )}
        <span className="hidden sm:inline">
          {status === "saving"
            ? "Saving..."
            : status === "success"
              ? "Saved!"
              : status === "error"
                ? "Error"
                : "Save to Identity"}
        </span>
      </button>

      {/* Error tooltip */}
      {status === "error" && errorMsg && (
        <div className="absolute top-full right-0 mt-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] whitespace-nowrap z-50">
          {errorMsg}
        </div>
      )}

      {/* Success tooltip */}
      {status === "success" && (
        <div className="absolute top-full right-0 mt-1 px-2 py-1 rounded bg-emerald-600 text-white text-[10px] whitespace-nowrap z-50">
          Resume data saved to Professional Identity
        </div>
      )}
    </div>
  );
}

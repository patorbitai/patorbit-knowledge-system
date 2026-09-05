"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link, Copy, Check, ExternalLink } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";

interface ShareResumeModalProps {
  open: boolean;
  onClose: () => void;
  resumeId: string;
  resumeName: string;
}

export function ShareResumeModal({ open, onClose, resumeId, resumeName }: ShareResumeModalProps) {
  const shareState = useResumeBuilder((s) => s.shareStates[resumeId]);
  const setShareState = useResumeBuilder((s) => s.setShareState);
  const clearShareState = useResumeBuilder((s) => s.clearShareState);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current share status on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/resumes/${resumeId}/share`)
      .then((r) => r.json())
      .then((data) => {
        setShareState(resumeId, {
          shareEnabled: data.shareEnabled ?? false,
          shareToken: data.shareToken ?? null,
          shareUrl: data.shareUrl ?? null,
        });
      })
      .catch(() => setError("Failed to load share status"))
      .finally(() => setLoading(false));
  }, [open, resumeId, setShareState]);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enable sharing");
      setShareState(resumeId, {
        shareEnabled: true,
        shareToken: data.shareToken,
        shareUrl: data.shareUrl,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to enable sharing");
    } finally {
      setLoading(false);
    }
  }, [resumeId, setShareState]);

  const handleDisable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to disable sharing");
      }
      clearShareState(resumeId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disable sharing");
    } finally {
      setLoading(false);
    }
  }, [resumeId, clearShareState]);

  const handleCopy = useCallback(async () => {
    if (!shareState?.shareUrl) return;
    const fullUrl = `${window.location.origin}${shareState.shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const input = document.createElement("input");
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareState?.shareUrl]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Share Resume</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{resumeName}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading && (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
                Preparing share link...
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {shareState?.shareEnabled ? (
                  <>
                    {/* Sharing enabled */}
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2">
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Public sharing is enabled
                      </p>
                      <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
                        Anyone with this link can view this resume.
                      </p>
                    </div>

                    {/* Share URL */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-3 py-2 text-xs text-gray-600 dark:text-slate-300 truncate">
                        {shareState.shareUrl
                          ? `${typeof window !== "undefined" ? window.location.origin : ""}${shareState.shareUrl}`
                          : ""}
                      </div>
                      <button
                        onClick={handleCopy}
                        className="rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-3 py-2 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] flex items-center gap-1.5"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    {/* Open link */}
                    {shareState.shareUrl && (
                      <a
                        href={shareState.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open shared resume
                      </a>
                    )}

                    {/* Disable button */}
                    <button
                      onClick={handleDisable}
                      disabled={loading}
                      className="w-full rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      Disable Sharing
                    </button>
                  </>
                ) : (
                  <>
                    {/* Sharing disabled */}
                    <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.08] px-3 py-2">
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        This resume is not publicly shared.
                      </p>
                    </div>

                    {/* Enable button */}
                    <button
                      onClick={handleEnable}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 px-3 py-2.5 text-xs font-medium text-white transition-colors"
                    >
                      <Link className="h-3.5 w-3.5" />
                      Enable Public Sharing
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

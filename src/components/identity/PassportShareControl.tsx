"use strict";

import { useState, useEffect } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { clsx } from "clsx";

export function PassportShareControl() {
  const resume = useResumeBuilder((s) => s.resume);
  const claims = useResumeBuilder((s) => s.resume.claims ?? []);
  const evidence = useResumeBuilder((s) => s.evidence ?? []);

  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetch("/api/passport/share")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled) {
          setShareEnabled(true);
          setShareUrl(data.shareUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleShare = async () => {
    const action = shareEnabled ? "disable" : "enable";
    const res = await fetch("/api/passport/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, passportData: { resume, claims, evidence } }),
    });
    const data = await res.json();
    if (res.ok) {
      setShareEnabled(data.enabled);
      setShareUrl(data.shareUrl ?? null);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Professional Passport Share Link</h3>
      <p className="text-xs text-slate-400">
        Enable public sharing so recruiters and hiring managers can view your verified Professional Passport.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={handleToggleShare}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-semibold transition-colors",
            shareEnabled
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          )}
        >
          {shareEnabled ? "Make Private / Disable Share" : "Enable Public Share"}
        </button>
        {shareEnabled && shareUrl && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}${shareUrl}`}
              className="bg-slate-900 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-300 w-full sm:w-80 select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white transition-colors shrink-0"
            >
              {copying ? "Copied!" : "Copy Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

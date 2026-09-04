"use client";

import { useState, useEffect } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { clsx } from "clsx";
import QRCode from "qrcode";

export function PassportShareControl() {
  const resume = useResumeBuilder((s) => s.resume);
  const claims = useResumeBuilder((s) => s.resume.claims ?? []);
  const evidence = useResumeBuilder((s) => s.evidence ?? []);

  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/passport/share")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.shareUrl) {
          setShareEnabled(true);
          setShareUrl(data.shareUrl);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (shareEnabled && shareUrl) {
      const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${shareUrl}`;
      QRCode.toString(
        fullUrl,
        { type: "svg", margin: 2, width: 128, color: { dark: "#000000", light: "#ffffff" } },
        (err, svg) => {
          if (!err && svg) {
            setQrSvg(svg);
          }
        }
      );
    }
  }, [shareEnabled, shareUrl]);

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
      if (!data.enabled) setQrSvg(null);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Professional Passport Share Link &amp; QR Code</h3>
      <p className="text-xs text-slate-400">
        Enable public sharing so recruiters and hiring managers can view your verified Professional Passport.
      </p>
      <div className="flex flex-col items-start gap-3 pt-2">
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
          <div className="space-y-3 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
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
            {qrSvg && (
              <div className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] w-fit">
                <div
                  className="w-32 h-32 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <span className="text-[11px] font-medium text-slate-400">Scan to view Passport</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

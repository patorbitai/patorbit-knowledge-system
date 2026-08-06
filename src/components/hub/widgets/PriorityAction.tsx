"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import type { IdentityScoreData } from "@/lib/identity-score";

type Props = { data: IdentityScoreData };

type Action = { message: string; cta: string; href: string };

function getPriorityAction(data: IdentityScoreData): Action | null {
  if (data.resumeCompleteness === 0)
    return {
      message: "Start with your resume — it's the foundation of your professional identity.",
      cta: "Build resume",
      href: "/resume-builder",
    };
  if (data.verifiedCredentials === 0)
    return {
      message: "Verify your first credential to establish trust with recruiters and employers.",
      cta: "Verify now",
      href: "/trust",
    };
  if (data.passportClaims === 0)
    return {
      message: "Build your shareable passport to take your verified identity anywhere.",
      cta: "Open passport",
      href: "/passport",
    };
  if (!data.aiUsed)
    return {
      message: "Run an AI analysis to surface career insights and opportunities.",
      cta: "Run AI analysis",
      href: "/ai",
    };
  return null;
}

export default function PriorityAction({ data }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const action = getPriorityAction(data);

  if (!action || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start justify-between gap-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] px-4 py-3.5"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm.5 7.5h-1v-4h1v4zm0-5h-1V2.5h1V3.5z" />
          </svg>
        </span>
        <p className="text-sm text-slate-300 leading-relaxed">
          <span className="font-medium text-white">Next step: </span>
          {action.message}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={action.href}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:text-cyan-300"
        >
          {action.cta} →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded p-0.5 text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

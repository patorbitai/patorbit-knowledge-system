"use strict";

import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";
import { PublicResumeViewer } from "./PublicResumeViewer";

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Find resume by share token — no auth required
  const record = await prisma.resume.findUnique({
    where: { shareToken: token },
  });

  // Must be: exists, share enabled, share token matches
  if (!record || !record.shareEnabled || record.shareToken !== token) {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Resume Unavailable</h1>
          <p className="text-xs text-slate-400">
            This shared resume link is invalid, has been disabled, or does not exist.
          </p>
        </div>
      </main>
    );
  }

  // Extract public-safe data only — no internal fields
  const resume = record.payload as Record<string, unknown>;
  const publicData = {
    resumeId: record.resumeId,
    resumeName: record.resumeName,
    templateId: record.templateId,
    careerStage: record.careerStage,
    resume,
  };

  return (
    <main className="min-h-screen bg-[#070911] py-12 px-4 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-400 border border-cyan-500/20">
              Shared Resume
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">{record.resumeName}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Read-only shared resume.
            </p>
          </div>
        </div>

        {/* Resume content — client-side paginated renderer */}
        <PublicResumeViewer data={publicData} />
      </div>
    </main>
  );
}

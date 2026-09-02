"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { getActiveTemplate } from "@/components/resume/ResumePreview";
import { Passport } from "@/components/identity/Passport";
import { NetworkView } from "@/components/identity/NetworkView";
import { TrustTimelineView } from "@/components/identity/TrustTimelineView";
import { ExportModal } from "@/components/resume-builder/ExportModal";
import { CustomizePanel } from "@/components/resume-builder/CustomizePanel";
import { LiveStylePreview } from "@/components/resume-builder/LiveStylePreview";
import { ArrowLeft, FileText, CreditCard, Network, Clock, Palette, Download, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const tabs = [
  { id: "resume" as const, label: "Resume", icon: FileText },
  { id: "passport" as const, label: "Passport", icon: CreditCard },
  { id: "knowledge-graph" as const, label: "Knowledge", icon: Network },
  { id: "trust-timeline" as const, label: "Timeline", icon: Clock },
];

const SAVE_STATUS: Record<string, { label: string; color: string }> = {
  saved: { label: "Saved", color: "bg-emerald-400" },
  saving: { label: "Saving…", color: "bg-amber-400 animate-pulse" },
  unsaved: { label: "Unsaved", color: "bg-amber-400" },
  offline: { label: "Offline", color: "bg-slate-500" },
  "sync-failed": { label: "Failed", color: "bg-rose-400" },
};

export default function PreviewPage() {
  const resume = useResumeBuilder((s) => s.resume);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("resume");
  const [showExport, setShowExport] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const template = getActiveTemplate(resume);
  const status = SAVE_STATUS[saveStatus] ?? SAVE_STATUS.saved;

  return (
    <main className="h-[100dvh] flex bg-[#060a14] text-white font-sans antialiased selection:bg-cyan-500/30 overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="w-[72px] shrink-0 flex flex-col items-center border-r border-white/[0.06] bg-[#080c18]">
        {/* Back */}
        <div className="w-full pt-4 pb-2 flex justify-center">
          <Link
            href="/resume-builder"
            aria-label="Back to Builder"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-white/[0.06]" />

        {/* Tabs */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-3 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] font-medium transition-all w-[56px] cursor-pointer",
                  active
                    ? "text-cyan-300 bg-cyan-500/[0.12]"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-cyan-400" />
                )}
                <Icon className="w-[18px] h-[18px]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-1.5 pb-4 w-full px-2">
          {/* Divider */}
          <div className="w-8 h-px bg-white/[0.06] mb-1" />

          <Link
            href="/templates"
            aria-label="Browse templates"
            className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] font-medium text-slate-500 hover:text-cyan-300 hover:bg-white/[0.04] transition-all w-full"
          >
            <Palette className="w-[18px] h-[18px]" />
            <span>Templates</span>
          </Link>

          <button
            onClick={() => setShowCustomize(true)}
            aria-label="Customize style"
            className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] font-medium text-slate-500 hover:text-cyan-300 hover:bg-white/[0.04] transition-all w-full cursor-pointer"
          >
            <SlidersHorizontal className="w-[18px] h-[18px]" />
            <span>Style</span>
          </button>

          <button
            onClick={() => setShowExport(true)}
            aria-label="Export resume"
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[10px] font-bold text-white bg-gradient-to-b from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-95 transition-all w-full cursor-pointer"
          >
            <Download className="w-[18px] h-[18px]" />
            <span>Export</span>
          </button>

          {/* Save indicator */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className={clsx("h-2 w-2 rounded-full", status.color)} />
            <span className="text-[9px] text-slate-600 font-medium">{status.label}</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between h-11 px-5 border-b border-white/[0.06] bg-[#080c18]">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-[13px] font-semibold text-white tracking-tight">Professional Preview</h1>
            {resume.resumeName && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-[12px] text-slate-400 truncate">{resume.resumeName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
              {template.name}
            </span>
          </div>
        </header>

        {/* Content — resume is the hero */}
        <div className="flex-1 min-h-0 overflow-hidden bg-[#060a14]">
          {activeTab === "resume" ? (
            <LiveStylePreview fitMode="contain" maxFit={1.5} />
          ) : (
            <div className="h-full overflow-y-auto flex items-start justify-center px-6 sm:px-10 py-8">
              {activeTab === "passport" && <Passport />}
              {activeTab === "knowledge-graph" && <NetworkView initialTab="graph" embedded />}
              {activeTab === "trust-timeline" && <TrustTimelineView embedded />}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />
    </main>
  );
}

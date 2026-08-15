"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { getActiveTemplate } from "@/components/resume/ResumePreview";
import { Passport } from "@/components/identity/Passport";
import { NetworkView } from "@/components/identity/NetworkView";
import { TrustTimelineView } from "@/components/identity/TrustTimelineView";
import { ExportModal } from "@/components/resume-builder/ExportModal";
import { TemplateGallery } from "@/components/resume-builder/TemplateGallery";
import { CustomizePanel } from "@/components/resume-builder/CustomizePanel";
import { LiveStylePreview } from "@/components/resume-builder/LiveStylePreview";
import { ArrowLeft, FileText, IdCard, Share2, Shield, Layout, Download, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const tabs = [
  { id: "resume" as const, label: "Resume", icon: FileText },
  { id: "passport" as const, label: "Professional Passport", icon: IdCard },
  { id: "knowledge-graph" as const, label: "Knowledge Graph", icon: Share2 },
  { id: "trust-timeline" as const, label: "Trust Timeline", icon: Shield },
];

/** Subtle, unobtrusive save indicator (dot + small text). */
const SAVE_STATUS: Record<string, { label: string; dot: string }> = {
  saved: { label: "Saved", dot: "bg-emerald-400" },
  saving: { label: "Saving…", dot: "bg-amber-400 animate-pulse" },
  unsaved: { label: "Unsaved changes", dot: "bg-amber-400" },
  offline: { label: "Offline", dot: "bg-slate-500" },
  "sync-failed": { label: "Save failed", dot: "bg-rose-400" },
};

export default function PreviewPage() {
  const resume = useResumeBuilder((s) => s.resume);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("resume");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const template = getActiveTemplate(resume);
  const status = SAVE_STATUS[saveStatus] ?? SAVE_STATUS.saved;

  return (
    <main className="h-[100dvh] flex flex-col bg-[#070d18] text-[#f8fafc] font-sans antialiased selection:bg-cyan-500/30 overflow-hidden">
      {/* Header — single row, clear action hierarchy */}
      <header className="shrink-0 border-b border-[rgba(148,163,184,.12)] bg-[#070d18]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 sm:gap-3 h-14 px-3 sm:px-6">
          {/* Left: back + title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/resume-builder"
              aria-label="Back to Resume Builder"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Back to Builder</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.08] shrink-0 hidden sm:block" />
            <h1 className="text-[13px] font-semibold text-white tracking-tight truncate hidden sm:block">Professional Preview</h1>
            {resume.resumeName && (
              <span className="text-[11px] text-slate-500 truncate hidden xl:inline">· {resume.resumeName}</span>
            )}
          </div>

          {/* Center: subtle save status */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <span className={clsx("h-1.5 w-1.5 rounded-full", status.dot)} />
            <span className="text-[11px] text-slate-500">{status.label}</span>
          </div>

          {/* Right: actions — Export is the only primary action */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowTemplates(true)}
              aria-haspopup="dialog"
              aria-expanded={showTemplates}
              className="flex items-center gap-1.5 pl-2.5 pr-2.5 sm:pr-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.16] hover:text-white transition-all cursor-pointer"
            >
              <Layout className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span>Templates</span>
                <span className="text-[9px] text-slate-500">Current: {template.name}</span>
              </span>
              <span className="sm:hidden">Templates</span>
            </button>

            <button
              onClick={() => setShowCustomize(true)}
              aria-haspopup="dialog"
              aria-expanded={showCustomize}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.16] hover:text-white transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Customize
            </button>

            <button
              onClick={() => setShowExport(true)}
              aria-haspopup="dialog"
              aria-expanded={showExport}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#9333ea] text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <span className="hidden md:inline text-[10px] font-medium text-white/80">PDF / DOCX</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary navigation — compact, quiet */}
      <nav aria-label="Preview sections" className="shrink-0 flex items-center gap-0.5 px-3 sm:px-6 py-1.5 border-b border-[rgba(148,163,184,.08)] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
                active ? "text-cyan-300" : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
              {active && <span className="absolute inset-x-2 -bottom-[7px] h-0.5 rounded-full bg-cyan-400/70" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      {/* Content — the resume is the hero */}
      <div className="flex-1 min-h-0">
        {activeTab === "resume" ? (
          <LiveStylePreview fitMode="contain" maxFit={1.5} />
        ) : (
          <div className="h-full overflow-y-auto flex items-start justify-center px-4 sm:px-8 py-8">
            {activeTab === "passport" && <Passport />}
            {activeTab === "knowledge-graph" && <NetworkView initialTab="graph" embedded />}
            {activeTab === "trust-timeline" && <TrustTimelineView embedded />}
          </div>
        )}
      </div>

      {/* Modals — existing behavior, unchanged */}
      <TemplateGallery open={showTemplates} onClose={() => setShowTemplates(false)} />
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />
    </main>
  );
}

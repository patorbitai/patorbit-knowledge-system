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
  { id: "passport" as const, label: "Passport", icon: IdCard },
  { id: "knowledge-graph" as const, label: "Knowledge", icon: Share2 },
  { id: "trust-timeline" as const, label: "Timeline", icon: Shield },
];

const SAVE_STATUS: Record<string, { label: string; dot: string }> = {
  saved: { label: "Saved", dot: "bg-emerald-400" },
  saving: { label: "Saving…", dot: "bg-amber-400 animate-pulse" },
  unsaved: { label: "Unsaved", dot: "bg-amber-400" },
  offline: { label: "Offline", dot: "bg-slate-500" },
  "sync-failed": { label: "Failed", dot: "bg-rose-400" },
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
    <main className="h-[100dvh] flex bg-[#070d18] text-[#f8fafc] font-sans antialiased selection:bg-cyan-500/30 overflow-hidden">
      {/* ── Left Sidebar Toolbar ── */}
      <aside className="w-16 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-white/[0.06] bg-[#070d18]">
        {/* Back */}
        <Link
          href="/resume-builder"
          aria-label="Back to Builder"
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        <div className="w-8 h-px bg-white/[0.06] my-1" />

        {/* Tab navigation */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] transition-colors cursor-pointer",
                active
                  ? "text-cyan-300 bg-cyan-500/10"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-1 mb-2">
          <button
            onClick={() => setShowTemplates(true)}
            aria-label="Change template"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] text-slate-500 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Layout className="w-4 h-4" />
            <span>Template</span>
          </button>

          <button
            onClick={() => setShowCustomize(true)}
            aria-label="Customize"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] text-slate-500 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Style</span>
          </button>

          <button
            onClick={() => setShowExport(true)}
            aria-label="Export resume"
            className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[10px] font-semibold text-white bg-gradient-to-b from-[#0ea5e9] to-[#2563eb] shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Save status */}
        <div className="flex flex-col items-center gap-1 pb-2">
          <span className={clsx("h-2 w-2 rounded-full", status.dot)} />
          <span className="text-[9px] text-slate-600">{status.label}</span>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Minimal top bar */}
        <header className="shrink-0 flex items-center justify-between h-10 px-4 border-b border-white/[0.06] bg-[#070d18]">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs font-semibold text-white">Professional Preview</h1>
            {resume.resumeName && (
              <span className="text-[11px] text-slate-500 truncate">· {resume.resumeName}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="hidden sm:inline">Current: {template.name}</span>
          </div>
        </header>

        {/* Content — resume is the hero */}
        <div className="flex-1 min-h-0 overflow-hidden">
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
      </div>

      {/* Modals */}
      <TemplateGallery open={showTemplates} onClose={() => setShowTemplates(false)} />
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
      <CustomizePanel open={showCustomize} onClose={() => setShowCustomize(false)} />
    </main>
  );
}

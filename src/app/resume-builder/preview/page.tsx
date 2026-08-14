"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ResumePreview, getActiveTemplate } from "@/components/resume/ResumePreview";
import { Passport } from "@/components/identity/Passport";
import { SaveStatusIndicator } from "@/components/resume-builder/SaveStatusIndicator";
import { ExportModal } from "@/components/resume-builder/ExportModal";
import { ArrowLeft, FileText, IdCard, Share2, Shield, TrendingUp, Layout, Check, Download } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { TEMPLATES } from "@/app/resume-builder/templates";

const tabs = [
  { id: "resume" as const, label: "Resume", icon: FileText },
  { id: "passport" as const, label: "Professional Passport", icon: IdCard },
  { id: "knowledge-graph" as const, label: "Knowledge Graph", icon: Share2 },
  { id: "trust-timeline" as const, label: "Trust Timeline", icon: Shield },
];

export default function PreviewPage() {
  const resume = useResumeBuilder((s) => s.resume);
  const applyTemplate = useResumeBuilder((s) => s.applyTemplate);
  const analysis = useResumeBuilder((s) => s.analysis);
  const resumeScore = useResumeBuilder((s) => s.resumeScore);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("resume");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const template = getActiveTemplate(resume);

  return (
    <main className="min-h-screen bg-[#070d18] text-[#f8fafc] font-sans antialiased selection:bg-cyan-500/30">
      <div className="sticky top-0 z-30 bg-[#070d18]/90 backdrop-blur-xl border-b border-[rgba(148,163,184,.14)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/resume-builder" className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Builder
              </Link>
              <div className="h-4 w-px bg-[rgba(148,163,184,.2)]" />
              <h1 className="text-sm font-bold text-white tracking-tight">Professional Preview</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(15,23,42,0.8)] border border-[rgba(148,163,184,.14)]">
                <span className="text-[11px] font-medium text-cyan-400">{resume.name || "Untitled Resume"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SaveStatusIndicator />

              <button
                onClick={() => setShowExport(true)}
                aria-haspopup="dialog"
                aria-expanded={showExport}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#9333ea] text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF / Docx</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-[rgba(148,163,184,.2)] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <Layout className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{template.name}</span>
                </button>
                {showTemplatePicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTemplatePicker(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[#070d18] border border-[rgba(148,163,184,.2)] rounded-2xl shadow-2xl z-50 p-1.5 max-h-72 overflow-y-auto">
                      <div className="px-3 py-2 border-b border-[rgba(148,163,184,.14)] text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
                        Select Template ({TEMPLATES.length})
                      </div>
                      <div className="py-1 space-y-0.5">
                        {TEMPLATES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { applyTemplate(t.id); setShowTemplatePicker(false); }}
                            className={clsx(
                              "w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                              t.id === resume.templateId ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/30 text-white font-semibold" : "text-[#94a3b8] hover:bg-white/[0.04] hover:text-white"
                            )}
                          >
                            <span>{t.name}</span>
                            {t.id === resume.templateId && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pb-3 pt-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={clsx("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    activeTab === tab.id ? "bg-gradient-to-r from-[rgba(14,165,233,0.2)] to-[rgba(59,130,246,0.2)] text-cyan-300 border border-[rgba(34,211,238,0.4)] shadow-sm" : "text-[#94a3b8] hover:text-white hover:bg-white/[0.04] border border-[rgba(148,163,184,.14)]")}
                >
                  <Icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "resume" && <PreviewPanel><ResumePreview resume={resume} template={template} /></PreviewPanel>}
        {activeTab === "passport" && (
          <PreviewPanel>
            <Passport />
          </PreviewPanel>
        )}
        {activeTab === "knowledge-graph" && <PreviewPanel><Placeholder icon={Share2} title="Knowledge Graph" desc="Visualize your skills, experience, and professional connections as an interactive graph." /></PreviewPanel>}
        {activeTab === "trust-timeline" && <PreviewPanel><Placeholder icon={TrendingUp} title="Trust Timeline" desc="Track how your trust score evolves as you verify credentials and add evidence." /></PreviewPanel>}
      </div>
    </main>
  );
}

function PreviewPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] shadow-2xl p-8 backdrop-blur-xl">{children}</div>;
}

function Placeholder({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 text-slate-600 mb-4" />
      <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
      <p className="text-sm text-slate-400 max-w-md">{desc}</p>
    </div>
  );
}


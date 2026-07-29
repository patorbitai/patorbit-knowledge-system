"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ResumePreview, getActiveTemplate } from "@/components/resume/ResumePreview";
import { SaveStatusIndicator } from "@/components/resume-builder/SaveStatusIndicator";
import { ArrowLeft, FileText, IdCard, Share2, Shield, TrendingUp, Layout, Check } from "lucide-react";
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
  const template = getActiveTemplate(resume);

  return (
    <main className="min-h-screen bg-[#070911]">
      <div className="sticky top-0 z-30 bg-[#070911]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/resume-builder" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Builder
              </Link>
              <div className="h-4 w-px bg-white/[0.06]" />
              <h1 className="text-sm font-semibold text-white">Preview</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04]">
                <span className="text-[10px] text-slate-400">{resume.name || "Untitled"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SaveStatusIndicator />

              <div className="relative">
                <button
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>{template.name}</span>
                </button>
                {showTemplatePicker && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A1F35] border border-white/[0.08] rounded-lg shadow-2xl z-10 p-1">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { applyTemplate(t.id); setShowTemplatePicker(false); }}
                        className={clsx(
                          "w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors",
                          t.id === resume.templateId ? "bg-blue-500/10 text-white" : "text-slate-400 hover:bg-white/[0.04]"
                        )}
                      >
                        <span>{t.name}</span>
                        {t.id === resume.templateId && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                    activeTab === tab.id ? "bg-blue-500/15 text-blue-300 border border-blue-500/25" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent")}
                >
                  <Icon className="w-3 h-3" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "resume" && <PreviewPanel><ResumePreview resume={resume} template={template} /></PreviewPanel>}
        {activeTab === "passport" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><PreviewPanel><PassportPreview resume={resume} /></PreviewPanel></div>
          </div>
        )}
        {activeTab === "knowledge-graph" && <PreviewPanel><Placeholder icon={Share2} title="Knowledge Graph" desc="Visualize your skills, experience, and professional connections as an interactive graph." /></PreviewPanel>}
        {activeTab === "trust-timeline" && <PreviewPanel><Placeholder icon={TrendingUp} title="Trust Timeline" desc="Track how your trust score evolves as you verify credentials and add evidence." /></PreviewPanel>}
      </div>
    </main>
  );
}

function PreviewPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">{children}</div>;
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

function PassportPreview({ resume }: { resume: any }) {
  const skills = resume.skills || []; const certs = resume.certifications || []; const exp = resume.experience || [];
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Professional Passport</h2>
      <p className="text-sm text-slate-400">A verified, portable identity that travels with you across platforms.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">🎓 Verified Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.length > 0 ? skills.slice(0, 8).map((s: any, i: number) => (
              <span key={i} className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">{s.name}</span>
            )) : <span className="text-[11px] text-slate-500 italic">No skills added</span>}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">🏅 Verified Credentials</h3>
          <div className="space-y-1.5">
            {certs.length > 0 ? certs.slice(0, 3).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10"><Shield className="w-3 h-3 text-emerald-400" /></span>
                <span className="text-slate-300">{c.name}</span>
              </div>
            )) : <span className="text-[11px] text-slate-500 italic">No certifications added</span>}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">💼 Work History</h3>
          <div className="space-y-1.5">
            {exp.length > 0 ? exp.slice(0, 3).map((e: any, i: number) => (
              <div key={i} className="text-[11px] text-slate-300"><span className="font-medium">{e.position}</span> at <span>{e.company}</span></div>
            )) : <span className="text-[11px] text-slate-500 italic">No experience added</span>}
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">🔗 Connected Accounts</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <div className={clsx("flex h-5 w-5 items-center justify-center rounded", resume.social.linkedin ? "bg-blue-500/10" : "bg-slate-500/10")}>
                <span className={resume.social.linkedin ? "text-blue-400" : "text-slate-500"}>in</span>
              </div>
              <span className={resume.social.linkedin ? "text-slate-300" : "text-slate-500"}>{resume.social.linkedin ? "LinkedIn" : "Not connected"}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-500/10"><span className={resume.social.github ? "text-white" : "text-slate-500"}>G</span></div>
              <span className={resume.social.github ? "text-slate-300" : "text-slate-500"}>{resume.social.github ? "GitHub" : "Not connected"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

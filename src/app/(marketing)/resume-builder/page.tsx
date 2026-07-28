"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { TEMPLATES, type ResumeTemplate } from "./templates";
import ProficiencyDropdown from "@/components/ui/ProficiencyDropdown";
import {
  validateAll,
  getFieldError,
  type ValidationErrors,
  type ArrayValidationErrors,
  type TouchedFields,
} from "@/utils/validation";
import { parseResumeJson } from "@/utils/resume-schema";
import { exportToPdf, exportToDocx } from "@/utils/export";
import { ExecutivePreview, ModernCleanPreview, SplitVibrantPreview, ClassicSerifPreview, TechMonoPreview } from "./template-components";

/* ── Types ── */
interface Experience { id: number; company: string; position: string; location: string; employmentType: string; industry: string; duration: string; description: string; achievements: string; techUsed: string; }
interface Education { id: number; school: string; degree: string; year: string; field: string; gpa: string; minor: string; honors: string; activities: string; location: string; }
interface Skill { id: number; name: string; level: "Beginner" | "Intermediate" | "Advanced" | "Expert"; category: string; years: string; }
interface Project { id: number; name: string; description: string; tech: string; link: string; startDate: string; endDate: string; role: string; teamSize: string; status: "Completed" | "In Progress" | "Ongoing"; }
interface Certification { id: number; name: string; issuer: string; date: string; link: string; description: string; expiryDate: string; skills: string; }
interface Language { id: number; name: string; proficiency: "Native" | "Fluent" | "Professional" | "Conversational" | "Beginner"; }
interface Interest { id: number; name: string; }
interface Achievement { id: number; description: string; }
interface Reference { id: number; name: string; company: string; position: string; email: string; phone: string; }
interface SocialLinks { linkedin: string; github: string; website: string; twitter: string; portfolio: string; stackoverflow: string; }
interface Resume { name: string; title: string; email: string; phone: string; address: string; nationality: string; pronouns: string; summary: string; social: SocialLinks; experience: Experience[]; education: Education[]; skills: Skill[]; projects: Project[]; certifications: Certification[]; languages: Language[]; interests: Interest[]; achievements: Achievement[]; references: Reference[]; templateId: string; }

const defaultResume: Resume = {
  name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [], education: [], skills: [], projects: [], certifications: [],
  languages: [], interests: [], achievements: [], references: [],
  templateId: TEMPLATES[0].id,
};

const SECTIONS = [
  { id: "personal", label: "Personal Info", icon: "👤" },
  { id: "experience", label: "Experience", icon: "💼" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "skills", label: "Skills", icon: "⚡" },
  { id: "projects", label: "Projects", icon: "📁" },
  { id: "certifications", label: "Certifications", icon: "🏅" },
] as const;

const STORAGE_KEY = "patorbit-resume-data";


function reorderItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const copy = [...items]; const [moved] = copy.splice(from, 1); copy.splice(to, 0, moved);
  return copy;
}

function isSectionComplete(sectionId: string, resume: Resume): boolean {
  switch (sectionId) {
    case "personal": return !!(resume.name && resume.email && resume.phone);
    case "experience": return resume.experience.length > 0 && resume.experience.some(e => e.company && e.position);
    case "education": return resume.education.length > 0 && resume.education.some(e => e.school && e.degree);
    case "skills": return resume.skills.length > 0 && resume.skills.some(s => s.name);
    case "projects": return resume.projects.length > 0 && resume.projects.some(p => p.name);
    case "certifications": return resume.certifications.length > 0 && resume.certifications.some(c => c.name);
    default: return false;
  }
}

function calcProgress(resume: Resume): number {
  return Math.round(SECTIONS.filter(s => isSectionComplete(s.id, resume)).length / SECTIONS.length * 100);
}

/* ── Icons ── */
const I = {
  user: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
  mail: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>,
  phone: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>,
  company: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5"/></svg>,
  position: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/></svg>,
  location: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>,
  time: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  school: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"/></svg>,
  degree: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"/></svg>,
  tech: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>,
  link: <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.572a3.845 3.845 0 00-4.06-.86L7.652 7.652"/></svg>,
};

export default function ResumeBuilderPage() {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [loaded] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("unsaved");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [errors, setErrors] = useState<Record<string, ValidationErrors | ArrayValidationErrors>>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const initTouched = useRef(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const validate = useCallback(() => {
    if (!initTouched.current) return;
    const allErrors = validateAll(resume as any, {
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
      certifications: resume.certifications,
    } as any);
    setErrors(allErrors);
  }, [resume]);

  useEffect(() => {
    if (!loaded) return;
    validate();
    setSaveStatus("unsaved");
    const timer = setTimeout(() => {
      setSaveStatus("saving");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [resume, loaded, validate]);

  const handleBlur = (field: string, section: string, index?: number) => {
    const key = index !== undefined ? `${section}.${index}.${field}` : field;
    if (!touched[key]) {
      setTouched(prev => ({ ...prev, [key]: true }));
      if (!initTouched.current) initTouched.current = true;
    }
  };

  const getError = (field: string, section: string, index?: number) => {
    const key = index !== undefined ? `${section}.${index}.${field}` : field;
    if (!touched[key]) return undefined;
    return getFieldError(section, field, index ?? null, errors);
  };

  const updateField = useCallback(<K extends keyof Resume>(key: K, value: Resume[K]) => setResume(prev => ({ ...prev, [key]: value })), []);
  const updateSocial = (key: keyof SocialLinks, value: string) => setResume(prev => ({ ...prev, social: { ...prev.social, [key]: value } }));
  const setTemplate = (id: string) => { setResume(prev => ({ ...prev, templateId: id })); setShowTemplatePicker(false); };
  const handleExportPDF = () => exportToPdf("resume-preview", `resume-${new Date().toISOString().slice(0, 10)}`);
  const handleExportDOCX = () => exportToDocx(resume, `resume-${new Date().toISOString().slice(0, 10)}`);
  const resetResume = () => { localStorage.removeItem(STORAGE_KEY); setResume(defaultResume); setShowResetConfirm(false); };

  const arrayHelpers = <T extends { id: number }>(key: keyof Resume, emptyItem: Omit<T, 'id'>) => ({
    add: () => setResume(prev => ({ ...prev, [key]: [...((prev[key] ?? []) as unknown as T[]), { ...emptyItem, id: Date.now() } as T] })),
    update: (id: number, field: string, value: any) => setResume(prev => ({ ...prev, [key]: ((prev[key] ?? []) as unknown as T[]).map(item => item.id === id ? { ...item, [field]: value } : item) })),
    remove: (id: number) => setResume(prev => ({ ...prev, [key]: ((prev[key] ?? []) as unknown as T[]).filter(item => item.id !== id) })),
    move: (id: number, dir: -1 | 1) => setResume(prev => { const items = (prev[key] ?? []) as unknown as T[]; const idx = items.findIndex(item => item.id === id); return { ...prev, [key]: reorderItem(items, idx, idx + dir) }; }),
  });

  const expHelper = arrayHelpers<Experience>("experience", { company: "", position: "", location: "", employmentType: "", industry: "", duration: "", description: "", achievements: "", techUsed: "" });
  const eduHelper = arrayHelpers<Education>("education", { school: "", degree: "", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" });
  const skillHelper = arrayHelpers<Skill>("skills", { name: "", level: "Intermediate", category: "", years: "" });
  const projHelper = arrayHelpers<Project>("projects", { name: "", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" });
  const certHelper = arrayHelpers<Certification>("certifications", { name: "", issuer: "", date: "", link: "", description: "", expiryDate: "", skills: "" });

  const activeTemplate = TEMPLATES.find(t => t.id === resume.templateId) || TEMPLATES[0];
  const progressPct = calcProgress(resume);

  return (
    <main className="min-h-screen bg-[#070B14] text-white print:bg-white print:text-black" ref={mainRef}>
      {/* ── Top Bar ── */}
      <div className="sticky top-16 z-30 bg-[#070B14] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_40px_-12px_rgba(0,0,0,0.6)] print:hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.08] transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} /></svg>
              </button>
              <div className="flex items-center gap-3"><div><h1 className="text-sm font-semibold text-white tracking-tight">Resume Builder</h1><p className="text-[10px] text-slate-500">Build your professional resume</p></div></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium", saveStatus === "saved" && "text-emerald-400 bg-emerald-500/15", saveStatus === "saving" && "text-amber-400 bg-amber-500/15", saveStatus === "unsaved" && "text-slate-500 bg-white/[0.05]")}>
                {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
              </span>
              <div className="relative">
                <button onClick={() => setShowTemplatePicker(!showTemplatePicker)} className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[11px] text-slate-300 hover:bg-white/[0.1] transition-colors flex items-center gap-1.5">
                  <span>{activeTemplate.preview}</span><span className="hidden sm:inline">{activeTemplate.name}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showTemplatePicker && (
                  <><div className="fixed inset-0 z-10" onClick={() => setShowTemplatePicker(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-20 w-56 bg-[#0F1629] border border-white/[0.1] rounded-xl shadow-2xl max-h-72 overflow-y-auto p-1.5">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setTemplate(t.id)}
                          className={clsx("w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors text-xs",
                            resume.templateId === t.id ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-white/[0.06]")}>
                          <span className="text-base">{t.preview}</span><span className="font-medium">{t.name}</span>
                          {resume.templateId === t.id && <svg className="w-3 h-3 ml-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setShowExportModal(true)} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export Resume
              </button>
              <button onClick={() => setShowImportModal(true)} className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[11px] font-medium hover:bg-indigo-500/25 transition-all flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                Import
              </button>
              <button onClick={() => setShowResetConfirm(true)} className="px-2.5 py-1.5 rounded-lg text-red-400 text-[11px] hover:bg-red-500/15 transition-colors">Reset</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 print:py-0 print:px-0">
        <div className="flex gap-5 print:block">
          {/* ── Sidebar ── */}
          <div className={clsx("hidden lg:flex flex-col shrink-0 transition-all duration-300 print:hidden", sidebarCollapsed ? "w-0 overflow-hidden" : "w-[220px]")}>
            <div className="sticky top-32 h-full">
              <div className="bg-gradient-to-b from-[#0F1629] to-[#0D1322] rounded-2xl border border-white/[0.06] p-4 shadow-xl h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[11px] font-semibold text-white/70 tracking-[0.08em] uppercase">Sections</span>
                  <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full font-mono font-medium">
                    {SECTIONS.findIndex(s => s.id === activeSection) + 1}/{SECTIONS.length}
                  </span>
                </div>
                <nav className="space-y-[2px] flex-1">
                  {SECTIONS.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    const isCompleted = !isActive && isSectionComplete(section.id, resume);
                    return (
                      <button key={section.id} onClick={() => setActiveSection(section.id)}
                        className={clsx("relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 text-left group",
                          isActive ? "bg-blue-500/15 border border-blue-500/25 shadow-[0_0_20px_-8px_rgba(59,130,246,0.3)]" : "hover:bg-white/[0.04] border border-transparent")}>
                        {idx < SECTIONS.length - 1 && (
                          <div className={clsx("absolute left-[17px] top-9 w-px h-[calc(100%+4px)] transition-all duration-500",
                            isCompleted ? "bg-gradient-to-b from-blue-500/50 to-blue-500/20" : "bg-white/[0.06]")} />
                        )}
                        <motion.div className={clsx("relative z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 shrink-0",
                          isActive ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30 scale-110" : isCompleted ? "bg-emerald-500/20 border-emerald-500/40" : "bg-white/[0.04] border-white/[0.08] group-hover:border-white/[0.15]")}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          {isCompleted ? (
                            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </motion.svg>
                          ) : (
                            <span className={clsx("text-[10px]", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300 transition-colors")}>{section.icon}</span>
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx("text-sm font-medium truncate transition-colors duration-200 leading-tight", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{section.label}</p>
                          <p className={clsx("text-[10px] mt-0.5 truncate tracking-wide transition-colors duration-200", isActive ? "text-blue-400/80" : isCompleted ? "text-emerald-500/70" : "text-slate-600")}>
                            {isActive ? "Editing" : isCompleted ? "Completed" : "Pending"}
                          </p>
                        </div>
                        {isActive && <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0 ring-2 ring-blue-400/20" />}
                      </button>
                    );
                  })}
                </nav>
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                    <span className="font-medium tracking-wide">Progress</span>
                    <span className="font-mono text-slate-400">{progressPct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden ring-1 ring-white/[0.02]">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-400" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Trust & Platform Info ── */}
            <div className="mt-3 hidden xl:block">
              <div className="bg-gradient-to-br from-[#0F1629] to-[#0D1322] rounded-2xl border border-white/[0.06] p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-[10px]">✓</span>
                  <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Platform Trust</span>
                </div>
                <div className="space-y-1 text-[9px] text-slate-400">
                  <div className="flex items-center gap-1.5"><span className="text-emerald-400 text-[8px]">🔒</span> End-to-end encrypted</div>
                  <div className="flex items-center gap-1.5"><span className="text-blue-400 text-[8px]">☁️</span> Auto-saved locally</div>
                  <div className="flex items-center gap-1.5"><span className="text-amber-400 text-[8px]">📋</span> 5 professional templates</div>
                  <div className="flex items-center gap-1.5"><span className="text-purple-400 text-[8px]">📤</span> Export to JSON / PDF / print</div>
                  <div className="flex items-center gap-1.5"><span className="text-cyan-400 text-[8px]">🛡️</span> Your data stays on your device</div>
                </div>
              </div>
            </div>
            {/* Trust/Passport section */}
            <div className="mt-3 hidden xl:block">
              <div className="bg-gradient-to-br from-[#0F1629] to-[#0D1322] rounded-2xl border border-white/[0.06] p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-green-500/15 text-green-400 text-[10px]">✓</span>
                  <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Trust/Passport</span>
                </div>
                <div className="space-y-1 text-[9px] text-slate-400">
                  <div className="flex items-center gap-1.5"><span className="text-green-400 text-[8px]">🌍</span> Global-ready</div>
                  <div className="flex items-center gap-1.5"><span className="text-green-400 text-[8px]">✅</span> Verified Credentials</div>
                  <div className="flex items-center gap-1.5"><span className="text-green-400 text-[8px]">📄</span> Standardized format</div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Mobile Tabs ── */}
          <div className="lg:hidden w-full print:hidden">
            <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-none">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    activeSection === s.id ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]")}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Form ── */}
          <div className="flex-1 min-w-0 print:hidden">
            <div className="bg-[#0F1629] rounded-2xl border border-white/[0.06] p-6 shadow-xl min-h-[500px] h-full">
              <AnimatePresence mode="wait">
                {activeSection === "personal" && (
                  <SectionForm key="personal" title="Personal Information" subtitle="Your basic contact details and professional summary">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field icon={I.user} value={resume.name} onChange={v => updateField("name", v)} onBlur={() => handleBlur("name", "personal")} placeholder="Full Name" type="name" error={getError("name", "personal")} />
                      <Field icon={I.position} value={resume.title} onChange={v => updateField("title", v)} placeholder="Professional Title" type="name" />
                      <Field icon={I.mail} value={resume.email} onChange={v => updateField("email", v)} onBlur={() => handleBlur("email", "personal")} placeholder="Email Address" type="email" error={getError("email", "personal")} />
                      <Field icon={I.phone} value={resume.phone} onChange={v => updateField("phone", v)} onBlur={() => handleBlur("phone", "personal")} placeholder="Phone Number" type="tel" error={getError("phone", "personal")} />
                      <Field icon={I.location} value={resume.address} onChange={v => updateField("address", v)} placeholder="Location / Address" />
                      <Field value={resume.nationality} onChange={v => updateField("nationality", v)} placeholder="Nationality" />
                      <Field value={resume.pronouns} onChange={v => updateField("pronouns", v)} placeholder="Pronouns" />
                      <div className="col-span-full">
                        <h3 className="text-xs font-semibold text-slate-400 mb-3 mt-2 uppercase tracking-wider">Online Presence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <SocialInput icon={<svg className="w-3.5 h-3.5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>} value={resume.social.linkedin} onChange={v => updateSocial("linkedin", v)} placeholder="LinkedIn" />
                          <SocialInput icon={<svg className="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>} value={resume.social.twitter} onChange={v => updateSocial("twitter", v)} placeholder="Twitter / X" />
                          <SocialInput icon={<svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>} value={resume.social.github} onChange={v => updateSocial("github", v)} placeholder="GitHub" />
                          <SocialInput icon={<svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>} value={resume.social.website} onChange={v => updateSocial("website", v)} placeholder="Website" />
                          <SocialInput icon={<svg className="w-3.5 h-3.5 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm-1.286-13.919c.46-.256.85-.49 1.145-.674.532-.33.8-.711.806-1.142.006-.488-.24-.93-.74-1.326-.498-.396-1.232-.594-2.202-.594-1.118 0-2.016.386-2.692 1.158-.676.772-1.014 1.826-1.014 3.163 0 1.416.35 2.482 1.048 3.2.698.716 1.534 1.075 2.508 1.075.562 0 1.146-.16 1.753-.479.162-.083.243-.138.243-.167 0-.076-.016-.482-.049-1.218-.033-.736-.048-1.27-.048-1.603 0-.736.505-1.098 1.506-1.098.356 0 .713.108 1.07.324.357.216.536.54.536.973v.848c0 2.05-.438 3.597-1.314 4.641-.876 1.044-2.11 1.566-3.701 1.566-1.795 0-3.272-.66-4.432-1.98-1.16-1.32-1.74-3.079-1.74-5.279 0-2.23.596-3.98 1.788-5.249 1.192-1.27 2.656-1.905 4.391-1.905 1.574 0 2.891.51 3.951 1.53 1.06 1.02 1.54 2.21 1.44 3.57 0 .56-.262 1.018-.787 1.374z"/></svg>} value={resume.social.portfolio} onChange={v => updateSocial("portfolio", v)} placeholder="Portfolio" />
                          <SocialInput icon={<svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21.008 0c1.105 0 2 .895 2 2v20c0 1.105-.895 2-2 2H2.998c-1.105 0-2-.895-2-2V2c0-1.105.895-2 2-2h18.01zM8.947 5.356H5.663v12.29h3.284V5.356zm1.905 0v12.29h1.98c2.586 0 3.972-1.469 3.972-3.934 0-2.022-1.18-3.28-2.933-3.392 1.418-.275 2.574-1.575 2.574-3.03 0-2.138-1.34-3.934-3.605-3.934h-1.988zm1.417 5.39c.932 0 1.56.53 1.56 1.557 0 1.025-.628 1.555-1.56 1.555h-1.242v-3.112h1.242zm-.175-4.153c.75 0 1.29.479 1.29 1.341 0 .866-.54 1.34-1.29 1.34h-1.067V6.593h1.067z"/></svg>} value={resume.social.stackoverflow} onChange={v => updateSocial("stackoverflow", v)} placeholder="Stack Overflow" />
                        </div>
                      </div>
                      <div className="col-span-full">
                        <DescriptionEditor
                          label="Professional Summary"
                          value={resume.summary}
                          onChange={v => updateField("summary", v)}
                          placeholder="Write a brief summary of your background and career goals..."

                        />
                      </div>
                    </div>
                  </SectionForm>
                )}
                {["experience", "education", "skills", "projects", "certifications"].map(sectionKey => {
                  const isExp = sectionKey === "experience", isEdu = sectionKey === "education", isSkill = sectionKey === "skills", isProj = sectionKey === "projects", isCert = sectionKey === "certifications";
                  const helper = isExp ? expHelper : isEdu ? eduHelper : isSkill ? skillHelper : isProj ? projHelper : certHelper;
                  const items = isExp ? resume.experience : isEdu ? resume.education : isSkill ? resume.skills : isProj ? resume.projects : resume.certifications;
                  const title = isExp ? "Experience" : isEdu ? "Education" : isSkill ? "Skills" : isProj ? "Projects" : "Certifications";
                  const subtitle = isExp ? "Your work history" : isEdu ? "Academic background" : isSkill ? "Technical & professional skills" : isProj ? "Notable projects" : "Professional certifications";
                  return activeSection === sectionKey && (
                    <SectionForm key={sectionKey} title={title} subtitle={subtitle}>
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
                          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={isExp ? "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38" : isEdu ? "M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84" : isSkill ? "M11.42 15.17l2.25-2.25m-3.75 3l2.25-2.25m5.5-8.5L9.53 10.86l-2.46-2.46m3.94-4.72L12 2.25l2.28 4.88" : isProj ? "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" : "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-400 mb-1">No {title.toLowerCase()} yet</p>
                          <p className="text-xs text-slate-500 mb-5">Add your first entry to get started</p>
                          <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Add {title}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-slate-500">{items.length} {items.length === 1 ? "entry" : "entries"}</p>
                            <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                              Add
                            </button>
                          </div>
                          {(items as any[]).map((item: any, i: number) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-[11px] font-bold">{i + 1}</div>
                                  <span className="text-xs font-medium text-slate-200">{title} {i + 1}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => helper.move(item.id, -1)} disabled={i === 0} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 transition-colors rounded-lg hover:bg-white/[0.06]">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                  </button>
                                  <button onClick={() => helper.move(item.id, 1)} disabled={i === items.length - 1} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 transition-colors rounded-lg hover:bg-white/[0.06]">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                  <button onClick={() => helper.remove(item.id)} className="p-1.5 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10 ml-0.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {isExp && (<>
                                  <ItemField icon={I.company} value={item.company} onChange={v => helper.update(item.id, "company", v)} onBlur={() => handleBlur("company", sectionKey, i)} placeholder="Company Name" error={getError("company", sectionKey, i)} />
                                  <ItemField icon={I.position} value={item.position} onChange={v => helper.update(item.id, "position", v)} onBlur={() => handleBlur("position", sectionKey, i)} placeholder="Position" error={getError("position", sectionKey, i)} />
                                  <ItemField icon={I.location} value={item.location} onChange={v => helper.update(item.id, "location", v)} placeholder="Location" />
                                  <ItemField icon={I.time} value={item.duration} onChange={v => helper.update(item.id, "duration", v)} placeholder="Duration" />
                                  <div className="col-span-full">
                                    <DescriptionEditor
                                      label="Description"
                                      value={item.description}
                                      onChange={v => helper.update(item.id, "description", v)}
                                      placeholder="• Describe your responsibilities and achievements"
                                      minHeight={75}
                                    />
                                  </div>
                                </>)}
                                {isProj && (<>
                                  <ItemField icon={I.user} value={item.name} onChange={v => helper.update(item.id, "name", v)} onBlur={() => handleBlur("name", sectionKey, i)} placeholder="Project Name" error={getError("name", sectionKey, i)} />
                                  <ItemField icon={I.tech} value={item.tech} onChange={v => helper.update(item.id, "tech", v)} placeholder="Technologies Used" />
                                  <ItemField icon={I.time} value={item.startDate} onChange={v => helper.update(item.id, "startDate", v)} placeholder="Start Date" />
                                  <ItemField icon={I.time} value={item.endDate} onChange={v => helper.update(item.id, "endDate", v)} placeholder="End Date" />
                                  <ItemField icon={I.position} value={item.role} onChange={v => helper.update(item.id, "role", v)} placeholder="Role" onBlur={() => handleBlur("role", sectionKey, i)} />
                                  <ItemField icon={I.link} value={item.link} onChange={v => helper.update(item.id, "link", v)} placeholder="Project Link" />
                                  <div className="col-span-full">
                                    <DescriptionEditor
                                      label="Description"
                                      value={item.description}
                                      onChange={v => helper.update(item.id, "description", v)}
                                      placeholder="• Describe your responsibilities and achievements"
                                      minHeight={75}
                                    />
                                  </div>
                                </>)}
                                {isEdu && (<>
                                  <ItemField icon={I.school} value={item.school} onChange={v => helper.update(item.id, "school", v)} onBlur={() => handleBlur("school", sectionKey, i)} placeholder="School / University" error={getError("school", sectionKey, i)} />
                                  <ItemField icon={I.degree} value={item.degree} onChange={v => helper.update(item.id, "degree", v)} onBlur={() => handleBlur("degree", sectionKey, i)} placeholder="Degree" error={getError("degree", sectionKey, i)} />
                                  <ItemField value={item.field} onChange={v => helper.update(item.id, "field", v)} placeholder="Field of Study" />
                                  <ItemField value={item.year} onChange={v => helper.update(item.id, "year", v)} placeholder="Year" />
                                  <ItemField value={item.gpa} onChange={v => helper.update(item.id, "gpa", v)} placeholder="GPA" />
                                </>)}
                                {isSkill && (
                                  <SkillCard
                                    item={item}
                                    index={i}
                                    total={items.length}
                                    onUpdate={(field, value) => helper.update(item.id, field as string, value)}
                                    onRemove={() => helper.remove(item.id)}
                                    onMoveUp={() => helper.move(item.id, -1)}
                                    onMoveDown={() => helper.move(item.id, 1)}
                                    section="skills"
                                    getError={getError}
                                    handleBlur={handleBlur}
                                  />
                                )}
                                {isCert && (<>
                                  <ItemField value={item.name} onChange={v => helper.update(item.id, "name", v)} onBlur={() => handleBlur("name", sectionKey, i)} placeholder="Certification Name" error={getError("name", sectionKey, i)} />
                                  <ItemField value={item.issuer} onChange={v => helper.update(item.id, "issuer", v)} placeholder="Issuer" />
                                  <ItemField value={item.date} onChange={v => helper.update(item.id, "date", v)} placeholder="Date" />
                                  <ItemField value={item.link} onChange={v => helper.update(item.id, "link", v)} placeholder="Credential Link" />
                                  <div className="col-span-full">
                                    <DescriptionEditor
                                      label="Description"
                                      value={item.description}
                                      onChange={v => helper.update(item.id, "description", v)}
                                      placeholder="• Optional details about the certification"
                                      minHeight={50}
                                    />
                                  </div>
                                </>)}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </SectionForm>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Preview Panel ── */}
          <div className="hidden xl:block w-full max-w-[620px] shrink-0">
            <div className="sticky top-32 h-full">
              <div className="bg-[#0F1629] rounded-2xl border border-white/[0.06] p-5 shadow-xl h-full">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Resume Preview</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPreviewMode(m => m === "desktop" ? "mobile" : "desktop")}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all" title={previewMode === "desktop" ? "Mobile view" : "Desktop view"}>
                      {previewMode === "desktop" ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
                      )}
                    </button>
                    <button onClick={() => setPreviewZoom(z => Math.max(0.4, z - 0.1))} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                    </button>
                    <span className="text-xs text-slate-400 w-8 text-center font-mono font-medium">{Math.round(previewZoom * 100)}%</span>
                    <button onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                    <button onClick={() => setPreviewZoom(1)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
                    </button>
                  </div>
                </div>
                <div className={clsx("flex justify-center", previewMode === "mobile" ? "mx-auto w-[200px]" : "w-full")} style={{ transform: `scale(${previewZoom})`, transformOrigin: "top center" }}>
                  <div className={clsx(previewMode === "mobile" ? "rounded-[28px] border-[4px] border-slate-700 overflow-hidden shadow-2xl" : "", "w-full")} id="resume-preview">
                    <ResumePreview resume={resume} template={activeTemplate} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile preview FAB ── */}
          <div className="xl:hidden fixed bottom-6 right-6 z-30 print:hidden">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/30 text-white hover:bg-blue-500 transition-all hover:scale-105 active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Import Resume Modal ── */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(data) => {
            setResume(data as Resume);
            setShowImportModal(false);
          }}
        />
      )}

      {/* ── Reset Confirmation ── */}
      {/* ── Export Resume Modal ── */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExportPDF={handleExportPDF}
          onExportDOCX={handleExportDOCX}
        />
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 print:hidden">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1629] border border-white/[0.08] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1.5">Reset Resume?</h3>
            <p className="text-xs text-slate-400 mb-5">This will permanently delete all your data.</p>
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] text-xs font-medium transition-all">Cancel</button>
              <button onClick={resetResume} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 text-xs font-semibold transition-all">Reset</button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

/* ── Sub-components ── */

function ExportModal({
  onClose,
  onExportPDF,
  onExportDOCX,
}: {
  onClose: () => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 print:hidden" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0F1629] border border-white/[0.08] rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Export Your Resume</h3>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.08] transition-all" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-4">Choose your desired file format.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onExportPDF}
            className="w-full px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Download as PDF
          </button>
          <button
            onClick={onExportDOCX}
            className="w-full px-4 py-3 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-sm font-medium hover:bg-blue-500/25 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download as DOCX
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 px-4 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-medium hover:bg-white/[0.06] transition-all">
          Cancel
        </button>
      </motion.div>
    </div>
  );
}

function sanitize(value: string, type?: string): string {
  switch (type) {
    case "name": return value.replace(/[^a-zA-Z\s'-]/g, "");
    case "tel": return value.replace(/[^0-9()+\-\s]/g, "");
    case "email": return value.replace(/[^a-zA-Z0-9@._+\-]/g, "");
    case "url": return value.replace(/[^a-zA-Z0-9:/._~\-?#[\]@!$&'()*+,;=%]/g, "");
    case "number": return value.replace(/[^0-9.]/g, "");
    case "text": return value;
    default: return value;
  }
}

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (resume: Resume) => void; }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!["application/json", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(selectedFile.type)) {
        setError("Invalid file type. Please upload a JSON, PDF, or DOCX file.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImportClick = async () => {
    if (!file) {
      setError("Please select a file to import.");
      return;
    }

    setIsParsing(true);
    setError(null);

    if (file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          const validatedData = parseResumeJson(data);
          onImport(validatedData as Resume);
        } catch (err: any) {
          setError(err.message || "Failed to parse JSON.");
        } finally {
          setIsParsing(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setIsParsing(false);
      };
      reader.readAsText(file);
    } else {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("/api/import", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          try {
            const err = await response.json();
            throw new Error(err.error || `Server error: ${response.status}`);
          } catch (e) {
            throw new Error(`Server error: ${response.status} - please try again later.`);
          }
        }

        const data = await response.json();
        const validatedData = parseResumeJson(data);
        onImport(validatedData as Resume);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 print:hidden">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F1629] border border-white/[0.08] rounded-2xl p-6 max-w-md mx-4 shadow-2xl w-full">
        <h3 className="text-sm font-semibold text-white mb-1.5">Import Resume</h3>
        <p className="text-xs text-slate-400 mb-5">Upload a JSON, PDF or DOCX file. This will overwrite your current data.</p>
        <div className="mb-4">
          <label htmlFor="file-upload" className="w-full flex flex-col items-center px-4 py-6 bg-white/[0.04] text-slate-400 rounded-lg border-2 border-dashed border-white/[0.1] cursor-pointer hover:bg-white/[0.06] hover:border-blue-500/50">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span className="text-sm font-medium">{file ? file.name : "Select a file"}</span>
          </label>
          <input id="file-upload" type="file" className="hidden" accept=".json,.pdf,.docx,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
        </div>
        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
        <div className="flex gap-2.5 justify-end">
          <button onClick={onClose} disabled={isParsing} className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] text-xs font-medium transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleImportClick} disabled={isParsing || !file} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isParsing ? "Importing..." : "Import"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 text-xs text-red-400"
    >
      {message}
    </motion.p>
  );
}

function Field({ icon, value, onChange, onBlur, placeholder, type = "text", error }: {
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  const hasError = !!error;
  return (
    <div>
      <div className="relative group">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60 group-focus-within:opacity-100 transition-opacity">{icon}</span>}
        <input
          type={type === "name" ? "text" : type}
          value={value || ""}
          onChange={e => onChange(sanitize(e.target.value, type))}
          onBlur={onBlur}
          className={clsx(
            "w-full bg-white/[0.04] border rounded-xl text-sm text-white focus:ring-1 focus:outline-none placeholder:text-slate-500 transition-all",
            icon ? "pl-10 pr-3.5 py-2.5" : "px-4 py-2.5",
            hasError
              ? "border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20"
              : "border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/20"
          )}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function ItemField({ icon, value, onChange, onBlur, placeholder, type = "text", error }: {
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  const hasError = !!error;
  return (
    <div className="flex flex-col">
      <div className="relative group">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity">{icon}</span>}
        <input
          type={type === "name" ? "text" : type}
          value={value || ""}
          onChange={e => onChange(sanitize(e.target.value, type))}
          onBlur={onBlur}
          className={clsx(
            "w-full bg-white/[0.04] border rounded-xl text-sm text-white focus:ring-1 focus:outline-none placeholder:text-slate-500 transition-all",
            icon ? "pl-9 pr-3 py-2.5" : "px-3.5 py-2.5",
            hasError
              ? "border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20"
              : "border-white/[0.06] focus:border-blue-500/50 focus:ring-blue-500/20"
          )}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function SocialInput({ icon, value, onChange, placeholder }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative group">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60 group-focus-within:opacity-100 transition-opacity">{icon}</span>
      <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all"
        placeholder={placeholder} autoComplete="off" />
    </div>
  );
}

function SectionForm({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
        </div>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  );
}

/* ── Proficiency Dropdown is imported from @/components/ui/ProficiencyDropdown ── */

/* ── Skill Card ── */
function SkillCard({ item, index, total, onUpdate, onRemove, onMoveUp, onMoveDown, section, getError, handleBlur }: {
  item: any;
  index: number;
  total: number;
  onUpdate: (field: string, value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  section: string;
  getError: (field: string, section: string, index?: number) => string | undefined;
  handleBlur: (field: string, section: string, index?: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="col-span-full bg-white/[0.03] rounded-2xl border border-white/[0.06] hover:border-white/[0.1] transition-all"
    >
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/[0.06] transition-all" title="Move up">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/[0.06] transition-all" title="Move down">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200 truncate">{item.name || "New Skill"}</span>
            {index === 0 && <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full font-medium shrink-0">Primary</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          <div className="text-right">
            <span className="text-xs text-slate-400">{item.level || "Intermediate"}</span>
            {item.years && <span className="text-[10px] text-slate-500 block"> {item.years} yr{Number(item.years) > 1 ? 's' : ''} exp</span>}
          </div>
          <button onClick={onRemove} className="p-1.5 text-red-500/80 hover:text-red-400 rounded-lg hover:bg-red-500/15 transition-all" title="Remove">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <motion.svg animate={{ rotate: expanded ? 0 : -90 }} className="w-4 h-4 text-slate-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.3, ease: 'easeOut' }, opacity: { duration: 0.2, delay: 0.1 } } }}
            exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.3, ease: 'easeIn' }, opacity: { duration: 0.2 } } }}
            className="overflow-visible"
          >
            <div className="border-t border-white/[0.06] bg-black/20 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Skill Name *</label>
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={e => onUpdate("name", e.target.value)}
                    onBlur={() => handleBlur("name", section, index)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all"
                    placeholder="e.g. React"
                  />
                  <FieldError message={getError("name", section, index)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={item.category || ""}
                    onChange={e => onUpdate("category", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all"
                    placeholder="e.g. Frontend"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Years of Exp *</label>
                    <input
                      type="text"
                      value={item.years || ""}
                      onChange={e => onUpdate("years", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all"
                      placeholder="e.g. 3"
                    />
                  </div>
                  <div>
                    <ProficiencyDropdown id={`skill-${item.id}`} value={item.level} onChange={v => onUpdate("level", v)} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Bullet-aware description component ── */
function FormattedDescription({ text, color, mutedColor, size = "xs" }: { text: string; color: string; mutedColor?: string; size?: string }) {
  if (!text) return null;
  const lines = text.split("\n").filter(line => line.trim().length > 0);
  const sizeClass = size === "sm" ? "text-sm" : "text-xs";

  const listItems = lines.map(line => {
    const trimmed = line.trim();
    const isBulleted = /^[•\-\*]\s*/.test(trimmed);
    const isNumbered = /^\d+[.)]\s*/.test(trimmed);
    if (isBulleted) {
      return { type: 'ul', content: trimmed.replace(/^[•\-\*]\s*/, "") };
    }
    if (isNumbered) {
      return { type: 'ol', content: trimmed.replace(/^\d+[.)]\s*/, "") };
    }
    return { type: 'p', content: line };
  });

  const hasList = listItems.some(item => item.type === 'ul' || item.type === 'ol');

  if (hasList) {
    let olCounter = 1;
    return (
      <div className="mt-0.5 space-y-0.5">
        {listItems.map((item, i) => {
          if (item.type === 'ul') {
            return (
              <div key={i} className="flex gap-1.5 items-start">
                <span className="shrink-0 text-sm leading-relaxed" style={{ color: mutedColor || color }}>•</span>
                <span className={`${sizeClass} leading-relaxed`} style={{ color: mutedColor || color }}>{item.content}</span>
              </div>
            );
          }
          if (item.type === 'ol') {
            return (
              <div key={i} className="flex gap-1.5 items-start">
                <span className="shrink-0 font-medium text-xs leading-relaxed min-w-[16px]" style={{ color }}>{olCounter++}.</span>
                <span className={`${sizeClass} leading-relaxed`} style={{ color: mutedColor || color }}>{item.content}</span>
              </div>
            );
          }
           return <p key={i} className={`${sizeClass} mt-0.5 leading-relaxed`} style={{ color: mutedColor || color }}>{item.content}</p>;
        })}
      </div>
    );
  }

  // No lists, just paragraphs
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p key={i} className={`${sizeClass} leading-relaxed`} style={{ color: mutedColor || color, whiteSpace: "pre-wrap" }}>{line}</p>
      ))}
    </div>
  );
}

/* ── Description Editor (toolbar + textarea) ── */
function DescriptionEditor({ value, onChange, placeholder, label, minHeight = 90 }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  minHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const val = ta.value;
    // Find the start of the current line
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = val.indexOf("\n", start);
    const line = val.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    const beforeLine = val.slice(0, lineStart);
    const afterLine = val.slice(lineEnd === -1 ? val.length : lineEnd);

    // Check if line already starts with this prefix
    if (line.trimStart().startsWith(prefix.trim())) {
      // Toggle off: remove the prefix
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;
      const newLine = line.slice(0, indent) + trimmed.slice(prefix.trim().length).trimStart();
      const newVal = beforeLine + newLine + afterLine;
      onChange(newVal);
      // Restore cursor position
      requestAnimationFrame(() => {
        ta.value = newVal;
        const cursor = lineStart + newLine.length;
        ta.setSelectionRange(cursor, cursor);
      });
    } else {
      // Toggle on: insert prefix
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;
      const prefixToInsert = prefix === "• " ? "• " : `${prefix}`;
      // If it's a numbered list, compute the right number
      let insertText = prefixToInsert;
      if (prefix === "1. ") {
        // Count preceding numbered lines
        const beforeText = beforeLine;
        const lines = beforeText.split("\n");
        let count = 0;
        for (let i = lines.length - 1; i >= 0; i--) {
          const l = lines[i].trim();
          if (/^\d+[.)]\s/.test(l)) {
            count++;
          } else if (l.length > 0 && !/^[•\-\*]\s/.test(l)) {
            break;
          }
        }
        insertText = `${count + 1}. `;
      }
      const newLine = line.slice(0, indent) + insertText + trimmed;
      const newVal = beforeLine + newLine + afterLine;
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.value = newVal;
        const cursor = lineStart + newLine.length;
        ta.setSelectionRange(cursor, cursor);
      });
    }
  };

  const handleBullet = () => insertAtCursor("• ");
  const handleNumbered = () => insertAtCursor("1. ");

  return (
    <div>
      <label className="block text-[10px] font-medium text-slate-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-1 mb-1.5">
        <button
          type="button"
          onClick={handleBullet}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all text-[11px]"
          title="Insert bullet list"
        >
          <span className="text-sm leading-none">•</span>
          <span>Bullet</span>
        </button>
        <button
          type="button"
          onClick={handleNumbered}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all text-[11px]"
          title="Insert numbered list"
        >
          <span className="text-sm leading-none font-mono font-bold">1.</span>
          <span>List</span>
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 focus:outline-none placeholder:text-slate-500 transition-all"
        style={{ minHeight }}
        placeholder={placeholder}
      />
    </div>
  );
}

/* ── Social Links component ── */
function SocialLinks({ social, color, size = "sm" }: { social: SocialLinks; color: string; size?: "sm" | "xs" }) {
  const s = size === "sm" ? "w-4 h-4" : "w-3.5 h-3.5";
  const links = [
    { key: "linkedin", href: social.linkedin, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
    { key: "github", href: social.github, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> },
    { key: "twitter", href: social.twitter, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { key: "website", href: social.website, icon: <svg className={s} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
    { key: "portfolio", href: social.portfolio, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm-1.286-13.919c.46-.256.85-.49 1.145-.674.532-.33.8-.711.806-1.142.006-.488-.24-.93-.74-1.326-.498-.396-1.232-.594-2.202-.594-1.118 0-2.016.386-2.692 1.158-.676.772-1.014 1.826-1.014 3.163 0 1.416.35 2.482 1.048 3.2.698.716 1.534 1.075 2.508 1.075.562 0 1.146-.16 1.753-.479.162-.083.243-.138.243-.167 0-.076-.016-.482-.049-1.218-.033-.736-.048-1.27-.048-1.603 0-.736.505-1.098 1.506-1.098.356 0 .713.108 1.07.324.357.216.536.54.536.973v.848c0 2.05-.438 3.597-1.314 4.641-.876 1.044-2.11 1.566-3.701 1.566-1.795 0-3.272-.66-4.432-1.98-1.16-1.32-1.74-3.079-1.74-5.279 0-2.23.596-3.98 1.788-5.249 1.192-1.27 2.656-1.905 4.391-1.905 1.574 0 2.891.51 3.951 1.53 1.06 1.02 1.54 2.21 1.44 3.57 0 .56-.262 1.018-.787 1.374z"/></svg> },
    { key: "stackoverflow", href: social.stackoverflow, icon: <svg className={s} viewBox="0 0 24 24" fill="currentColor"><path d="M21.008 0c1.105 0 2 .895 2 2v20c0 1.105-.895 2-2 2H2.998c-1.105 0-2-.895-2-2V2c0-1.105.895-2 2-2h18.01zM8.947 5.356H5.663v12.29h3.284V5.356zm1.905 0v12.29h1.98c2.586 0 3.972-1.469 3.972-3.934 0-2.022-1.18-3.28-2.933-3.392 1.418-.275 2.574-1.575 2.574-3.03 0-2.138-1.34-3.934-3.605-3.934h-1.988zm1.417 5.39c.932 0 1.56.53 1.56 1.557 0 1.025-.628 1.555-1.56 1.555h-1.242v-3.112h1.242zm-.175-4.153c.75 0 1.29.479 1.29 1.341 0 .866-.54 1.34-1.29 1.34h-1.067V6.593h1.067z"/></svg> },
  ];

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1" style={{ color }}>
      {links.map(({ key, href, icon }) => href && (
        <a key={key} href={href.startsWith("http") ? href : `https://${href}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
          {icon}
          <span className={size === "xs" ? "text-xs" : "text-sm"}>{href.replace(/^https?:\/\//, "")}</span>
        </a>
      ))}
    </div>
  );
}

/* ── Live Preview (A4 paper mockup) ── */
function ResumePreview({ resume, template }: { resume: Resume; template: ResumeTemplate }) {
  const empty = !resume.name && !resume.title && !resume.email && !resume.summary;

  if (empty) {
    return (
      <div className="bg-white text-black rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden min-h-[735px]">
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <p className="text-xs text-slate-400 font-medium">Preview</p>
          <p className="text-[10px] text-slate-300 mt-1">Add details to populate</p>
        </div>
      </div>
    );
  }

  switch (template.id) {
    case "executive":
      return <ExecutivePreview resume={resume} />;
    case "modern-clean":
      return <ModernCleanPreview resume={resume} />;
    case "split-vibrant":
      return <SplitVibrantPreview resume={resume} />;
    case "classic-serif":
      return <ClassicSerifPreview resume={resume} />;
    case "tech-mono":
      return <TechMonoPreview resume={resume} />;
    default:
      return <ModernCleanPreview resume={resume} />;
  }
}

function levelToDots(level: string | undefined): number {
  switch (level) {
    case "Expert": return 4;
    case "Advanced": return 3;
    case "Intermediate": return 2;
    case "Beginner": return 1;
    default: return 2;
  }
}
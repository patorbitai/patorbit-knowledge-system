"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { TEMPLATES, TEMPLATE_FONTS, type ResumeTemplate } from "./templates";

/* ── Types ── */
interface Experience { id: number; company: string; position: string; location: string; employmentType: string; industry: string; duration: string; description: string; achievements: string; techUsed: string; }
interface Education { id: number; school: string; degree: string; year: string; field: string; gpa: string; minor: string; honors: string; activities: string; location: string; }
interface Skill { id: number; name: string; level: "Beginner" | "Intermediate" | "Advanced" | "Expert"; category: string; years: string; }
interface Project { id: number; name: string; description: string; tech: string; link: string; startDate: string; endDate: string; role: string; teamSize: string; status: "Completed" | "In Progress" | "Ongoing"; }
interface Certification { id: number; name: string; issuer: string; date: string; link: string; description: string; expiryDate: string; skills: string; }
interface SocialLinks { linkedin: string; github: string; website: string; twitter: string; portfolio: string; stackoverflow: string; }
interface Resume { name: string; title: string; email: string; phone: string; address: string; nationality: string; pronouns: string; summary: string; social: SocialLinks; experience: Experience[]; education: Education[]; skills: Skill[]; projects: Project[]; certifications: Certification[]; templateId: string; }

const defaultResume: Resume = {
  name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [], education: [], skills: [], projects: [], certifications: [],
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

function loadResume(): Resume {
  if (typeof window === "undefined") return defaultResume;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultResume, ...JSON.parse(raw), templateId: JSON.parse(raw).templateId || TEMPLATES[0].id };
  } catch { /* */ }
  return defaultResume;
}

function reorderItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const copy = [...items]; const [moved] = copy.splice(from, 1); copy.splice(to, 0, moved);
  return copy;
}

function isSectionComplete(sectionId: string, resume: Resume): boolean {
  switch (sectionId) {
    case "personal": return !!(resume.name || resume.email || resume.phone);
    case "experience": return resume.experience.length > 0;
    case "education": return resume.education.length > 0;
    case "skills": return resume.skills.length > 0;
    case "projects": return resume.projects.length > 0;
    case "certifications": return resume.certifications.length > 0;
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
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("unsaved");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setResume(loadResume()); setLoaded(true); }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("unsaved");
    const timer = setTimeout(() => {
      setSaveStatus("saving");
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resume)); setSaveStatus("saved"); }
      catch { setSaveStatus("unsaved"); }
    }, 800);
    return () => clearTimeout(timer);
  }, [resume, loaded]);

  const updateField = useCallback(<K extends keyof Resume>(key: K, value: Resume[K]) => setResume(prev => ({ ...prev, [key]: value })), []);
  const updateSocial = (key: keyof SocialLinks, value: string) => setResume(prev => ({ ...prev, social: { ...prev.social, [key]: value } }));
  const setTemplate = (id: string) => { setResume(prev => ({ ...prev, templateId: id })); setShowTemplatePicker(false); };
  const downloadPDF = () => window.print();
  const resetResume = () => { localStorage.removeItem(STORAGE_KEY); setResume(defaultResume); setShowResetConfirm(false); };

  const arrayHelpers = <T extends { id: number }>(key: keyof Resume, emptyItem: Omit<T, 'id'>) => ({
    add: () => setResume(prev => ({ ...prev, [key]: [...((prev[key] ?? []) as unknown as T[]), { ...emptyItem, id: Date.now() } as T] })),
    update: (id: number, field: keyof T, value: any) => setResume(prev => ({ ...prev, [key]: ((prev[key] ?? []) as unknown as T[]).map(item => item.id === id ? { ...item, [field]: value } : item) })),
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
      <div className="sticky top-16 z-30 bg-[#070B14] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_30px_-10px_rgba(0,0,0,0.5)] print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} /></svg>
              </button>
              <div><h1 className="text-sm font-semibold text-white tracking-tight">Resume Builder</h1><p className="text-[10px] text-slate-500">Build your professional resume</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium", saveStatus === "saved" && "text-emerald-400 bg-emerald-500/10", saveStatus === "saving" && "text-amber-400 bg-amber-500/10", saveStatus === "unsaved" && "text-slate-500 bg-white/[0.05]")}>
                {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
              </span>
              <div className="relative">
                <button onClick={() => setShowTemplatePicker(!showTemplatePicker)} className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] text-[11px] text-slate-300 hover:bg-white/[0.08] transition-colors flex items-center gap-1.5">
                  <span>{activeTemplate.preview}</span><span className="hidden sm:inline">{activeTemplate.name}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showTemplatePicker && (
                  <><div className="fixed inset-0 z-10" onClick={() => setShowTemplatePicker(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-20 w-56 bg-[#0F1629] border border-white/[0.06] rounded-xl shadow-2xl max-h-64 overflow-y-auto p-1">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setTemplate(t.id)}
                          className={clsx("w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-colors text-xs",
                            resume.templateId === t.id ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-white/[0.04]")}>
                          <span className="text-base">{t.preview}</span><span className="font-medium">{t.name}</span>
                          {resume.templateId === t.id && <svg className="w-3 h-3 ml-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={downloadPDF} className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium hover:bg-blue-500/20 transition-all flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M12 11v5m0 0l-2-2m2 2l2-2" /></svg>
                PDF
              </button>
              <button onClick={() => setShowResetConfirm(true)} className="px-2 py-1.5 rounded-lg text-red-400 text-[11px] hover:bg-red-500/10 transition-colors">Reset</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:py-0 print:px-0">
        <div className="flex gap-6 print:block">
          {/* ── Sidebar ── */}
          <div className={clsx("hidden lg:block shrink-0 transition-all duration-300 print:hidden", sidebarCollapsed ? "w-0 overflow-hidden" : "w-[220px]")}>
            <div className="sticky top-[7.5rem]">
              <div className="bg-gradient-to-b from-[#0F1629]/80 to-[#0A0F1E]/80 rounded-2xl border border-white/[0.06] p-4 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[11px] font-semibold text-white/80 tracking-tight">Sections</span>
                  <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full font-medium">
                    {SECTIONS.findIndex(s => s.id === activeSection) + 1}/{SECTIONS.length}
                  </span>
                </div>
                <nav className="space-y-1">
                  {SECTIONS.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    const isCompleted = !isActive && isSectionComplete(section.id, resume);
                    return (
                      <button key={section.id} onClick={() => setActiveSection(section.id)}
                        className={clsx("relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-left group",
                          isActive ? "bg-gradient-to-r from-blue-500/15 to-indigo-500/10 border border-blue-500/25 shadow-sm" : "hover:bg-white/[0.04] border border-transparent")}>
                        {idx < SECTIONS.length - 1 && (
                          <div className={clsx("absolute left-[18px] top-10 w-[1px] h-[calc(100%+4px)] transition-all duration-500",
                            isCompleted ? "bg-gradient-to-b from-blue-500/50 to-blue-500/20" : "bg-white/[0.06]")} />
                        )}
                        <motion.div className={clsx("relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                          isActive ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/25 scale-110" : isCompleted ? "bg-blue-500/15 border-blue-500/40" : "bg-white/[0.04] border-white/[0.08] group-hover:border-white/[0.15]")}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          {isCompleted ? (
                            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </motion.svg>
                          ) : (
                            <span className={clsx("text-xs", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300 transition-colors")}>{section.icon}</span>
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx("text-xs font-medium truncate transition-colors duration-200", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{section.label}</p>
                          <p className="text-[9px] text-slate-600 mt-0.5 truncate">{isActive ? "Editing" : isCompleted ? "Done" : "Pending"}</p>
                        </div>
                        {isActive && <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />}
                      </button>
                    );
                  })}
                </nav>
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                    <span>Progress</span><span>{progressPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
                  </div>
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
                    activeSection === s.id ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.04] text-slate-400 border border-white/[0.06]")}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Form ── */}
          <div className="flex-1 min-w-0 print:hidden">
            <div className="bg-[#0F1629] rounded-2xl border border-white/[0.06] p-5 sm:p-6 shadow-xl min-h-[500px]">
              <AnimatePresence mode="wait">
                {activeSection === "personal" && (
                  <SectionForm key="personal" title="Personal Information" subtitle="Your basic contact details and professional summary">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <Field icon={I.user} value={resume.name} onChange={v => updateField("name", v)} placeholder="Full Name" />
                      <Field icon={I.position} value={resume.title} onChange={v => updateField("title", v)} placeholder="Professional Title" />
                      <Field icon={I.mail} value={resume.email} onChange={v => updateField("email", v)} placeholder="Email Address" type="email" />
                      <Field icon={I.phone} value={resume.phone} onChange={v => updateField("phone", v)} placeholder="Phone Number" type="tel" />
                      <Field icon={I.location} value={resume.address} onChange={v => updateField("address", v)} placeholder="Location / Address" />
                      <Field value={resume.nationality} onChange={v => updateField("nationality", v)} placeholder="Nationality" />
                      <Field value={resume.pronouns} onChange={v => updateField("pronouns", v)} placeholder="Pronouns" />
                      <div className="col-span-full">
                        <h3 className="text-xs font-semibold text-slate-400 mb-2.5 mt-1 uppercase tracking-wider">Online Presence</h3>
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
                        <label className="block text-xs font-medium mb-1.5 text-slate-400">Professional Summary</label>
                        <textarea value={resume.summary} onChange={e => updateField("summary", e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:outline-none min-h-[80px] resize-y placeholder:text-slate-500 transition-colors"
                          placeholder="Write a brief summary of your background and career goals..." />
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
                        <div className="flex flex-col items-center justify-center py-14 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={isExp ? "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38" : isEdu ? "M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84" : isSkill ? "M11.42 15.17l2.25-2.25m-3.75 3l2.25-2.25m5.5-8.5L9.53 10.86l-2.46-2.46m3.94-4.72L12 2.25l2.28 4.88" : isProj ? "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" : "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-400 mb-1">No {title.toLowerCase()} yet</p>
                          <p className="text-xs text-slate-500 mb-4">Add your first entry to get started</p>
                          <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Add {title}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-slate-500">{items.length} {items.length === 1 ? "entry" : "entries"}</p>
                            <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                              Add
                            </button>
                          </div>
                          {(items as any[]).map((item: any, i: number) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.1] transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold">{i + 1}</div>
                                  <span className="text-xs font-medium text-slate-200">{title} {i + 1}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => helper.move(item.id, -1)} disabled={i === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors rounded hover:bg-white/[0.06]">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                  </button>
                                  <button onClick={() => helper.move(item.id, 1)} disabled={i === items.length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors rounded hover:bg-white/[0.06]">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                  <button onClick={() => helper.remove(item.id)} className="p-1 text-red-400 hover:text-red-300 transition-colors rounded hover:bg-red-500/10 ml-0.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(isExp || isProj) && (<>
                                  <ItemField icon={I.company} value={item.company} onChange={v => helper.update(item.id, "company", v)} placeholder="Company Name" />
                                  <ItemField icon={I.position} value={item.position} onChange={v => helper.update(item.id, "position", v)} placeholder="Position" />
                                  <ItemField icon={I.location} value={item.location} onChange={v => helper.update(item.id, "location", v)} placeholder="Location" />
                                  <ItemField icon={I.time} value={item.duration} onChange={v => helper.update(item.id, "duration", v)} placeholder="Duration" />
                                  <div className="col-span-full"><span className="text-[10px] font-medium text-slate-500 mb-1 block">Description</span>
                                    <textarea value={item.description} onChange={e => helper.update(item.id, "description", e.target.value)}
                                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white focus:border-blue-500/50 outline-none min-h-[45px] resize-y" /></div>
                                </>)}
                                {isEdu && (<>
                                  <ItemField icon={I.school} value={item.school} onChange={v => helper.update(item.id, "school", v)} placeholder="School / University" />
                                  <ItemField icon={I.degree} value={item.degree} onChange={v => helper.update(item.id, "degree", v)} placeholder="Degree" />
                                  <ItemField value={item.field} onChange={v => helper.update(item.id, "field", v)} placeholder="Field of Study" />
                                  <ItemField value={item.year} onChange={v => helper.update(item.id, "year", v)} placeholder="Year" />
                                  <ItemField value={item.gpa} onChange={v => helper.update(item.id, "gpa", v)} placeholder="GPA" />
                                </>)}
                                {isSkill && (
                                  <SkillCard
                                    item={item}
                                    index={i}
                                    total={items.length}
                                    onUpdate={(field, value) => helper.update(item.id, field as keyof Skill, value)}
                                    onRemove={() => helper.remove(item.id)}
                                    onMoveUp={() => helper.move(item.id, -1)}
                                    onMoveDown={() => helper.move(item.id, 1)}
                                  />
                                )}
                                {isCert && (<>
                                  <ItemField value={item.name} onChange={v => helper.update(item.id, "name", v)} placeholder="Certification Name" />
                                  <ItemField value={item.issuer} onChange={v => helper.update(item.id, "issuer", v)} placeholder="Issuer" />
                                  <ItemField value={item.date} onChange={v => helper.update(item.id, "date", v)} placeholder="Date" />
                                  <ItemField value={item.link} onChange={v => helper.update(item.id, "link", v)} placeholder="Credential Link" />
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
          <div className="hidden xl:block w-[340px] shrink-0">
            <div className="sticky top-[7.5rem]">
              <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-3">
                {/* Preview toolbar */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] text-slate-500">Preview</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewMode(m => m === "desktop" ? "mobile" : "desktop")}
                      className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.06] transition-all" title={previewMode === "desktop" ? "Mobile view" : "Desktop view"}>
                      {previewMode === "desktop" ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
                      )}
                    </button>
                    <button onClick={() => setPreviewZoom(z => Math.max(0.4, z - 0.1))} className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.06] transition-all">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                    </button>
                    <span className="text-[10px] text-slate-500 w-6 text-center font-mono">{Math.round(previewZoom * 100)}%</span>
                    <button onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))} className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.06] transition-all">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                    <button onClick={() => setPreviewZoom(1)} className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.06] transition-all">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
                    </button>
                  </div>
                </div>
                {/* A4 Paper Preview */}
                <div className={clsx("flex justify-center", previewMode === "mobile" ? "mx-auto w-[180px]" : "")} style={{ transform: `scale(${previewZoom})`, transformOrigin: "top center" }}>
                  <div className={clsx(previewMode === "mobile" ? "rounded-[24px] border-[3px] border-slate-700 overflow-hidden shadow-xl" : "")}>
                    <ResumePreview resume={resume} template={activeTemplate} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile preview FAB ── */}
          <div className="xl:hidden fixed bottom-6 right-6 z-30 print:hidden">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30 text-white hover:bg-blue-400 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Reset Confirmation ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 print:hidden">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1629] border border-white/[0.06] rounded-xl p-5 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1.5">Reset Resume?</h3>
            <p className="text-xs text-slate-400 mb-5">This will permanently delete all your data.</p>
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-lg border border-white/[0.08] text-slate-300 hover:bg-white/[0.04] text-xs font-medium">Cancel</button>
              <button onClick={resetResume} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-semibold">Reset</button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

/* ── Sub-components ── */

function Field({ icon, value, onChange, placeholder, type = "text" }: { icon?: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="relative group">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 group-focus-within:opacity-100 transition-opacity">{icon}</span>}
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
        className={clsx("w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all",
          icon ? "pl-9 pr-3 py-2" : "px-3.5 py-2.5")} placeholder={placeholder} />
    </div>
  );
}

function ItemField({ icon, value, onChange, placeholder }: { icon?: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative group">
      {icon && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity">{icon}</span>}
      <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
        className={clsx("w-full bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white focus:border-blue-500/50 outline-none placeholder:text-slate-500 transition-all",
          icon ? "pl-8 pr-2.5 py-2" : "px-3 py-2")} placeholder={placeholder} />
    </div>
  );
}

function SocialInput({ icon, value, onChange, placeholder }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative group">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 group-focus-within:opacity-100 transition-opacity">{icon}</span>
      <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 outline-none placeholder:text-slate-500 transition-all"
        placeholder={placeholder} />
    </div>
  );
}

function SectionForm({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        <div className="h-px bg-gradient-to-r from-white/[0.08] to-transparent mt-3" />
      </div>
      {children}
    </motion.div>
  );
}

/* ── Proficiency Dropdown ── */
const PROFICIENCY_LEVELS = [
  { value: "Beginner", icon: "🟢", label: "Beginner", desc: "Basic understanding", color: "bg-emerald-500", barColor: "bg-emerald-400", pct: 25 },
  { value: "Intermediate", icon: "🔵", label: "Intermediate", desc: "Working knowledge", color: "bg-blue-500", barColor: "bg-blue-400", pct: 50 },
  { value: "Advanced", icon: "🟣", label: "Advanced", desc: "Highly proficient", color: "bg-purple-500", barColor: "bg-purple-400", pct: 75 },
  { value: "Expert", icon: "🔴", label: "Expert", desc: "Professional mastery", color: "bg-red-500", barColor: "bg-red-400", pct: 100 },
];

function ProficiencyDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = PROFICIENCY_LEVELS.find(l => l.value === value) || PROFICIENCY_LEVELS[1];

  return (
    <div className="relative">
      <span className="text-[10px] font-medium text-slate-500 mb-1 block">Proficiency Level</span>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#0B1220] border border-white/[0.08] rounded-xl text-sm text-white hover:border-blue-500/40 transition-all outline-none">
        <span>{selected.icon}</span>
        <span className="flex-1 text-left font-medium">{selected.label}</span>
        <span className="text-[10px] text-slate-500">{selected.desc}</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      {/* Proficiency bar indicator */}
      <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div className={`h-full rounded-full ${selected.barColor}`} initial={{ width: 0 }} animate={{ width: `${selected.pct}%` }} transition={{ duration: 0.5 }} />
      </div>
      <span className="text-[9px] text-slate-600 mt-0.5 block text-right">{selected.pct}%</span>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }} className="absolute z-20 left-0 right-0 top-full mt-1 bg-[#0F1629] border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
              {PROFICIENCY_LEVELS.map((level) => (
                <button key={level.value} type="button" onClick={() => { onChange(level.value); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors">
                  <span>{level.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{level.label}</span>
                    <span className="text-[10px] text-slate-500 block">{level.desc}</span>
                  </div>
                  {value === level.value && (
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Premium Skill Card ── */
function SkillCard({ item, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }: {
  item: any; index: number; total: number; onUpdate: (field: string, value: string) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl overflow-visible"
      whileHover={{ y: -2 }}
    >
      {/* Glass backdrop */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl shadow-2xl shadow-blue-500/[0.04]" />
      {/* Border overlay */}
      <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-hover:border-white/[0.14] transition-colors duration-300" />
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
      {/* Inner glow */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04]">
        {/* Drag handle */}
        <div className="flex flex-col gap-[2px] cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-60 transition-opacity">
          <span className="block w-3 h-[1.5px] bg-slate-400 rounded" />
          <span className="block w-3 h-[1.5px] bg-slate-400 rounded" />
          <span className="block w-3 h-[1.5px] bg-slate-400 rounded" />
        </div>
        {/* Number badge */}
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-[11px] font-bold">{index + 1}</div>
        {/* Title */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-200 truncate block">
            {item.name || "New Skill"}
            {index === 0 && <span className="ml-2 text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-medium align-middle">Primary</span>}
          </span>
          {item.category && <span className="text-[10px] text-slate-500 truncate block">{item.category}</span>}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
            <motion.svg animate={{ rotate: collapsed ? -90 : 0 }} className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/[0.06] transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/[0.06] transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={onRemove} className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all ml-0.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Skill Name */}
                <div className="relative group/input">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 group-focus-within/input:opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l2.25-2.25m-3.75 3l2.25-2.25m5.5-8.5L9.53 10.86l-2.46-2.46m3.94-4.72L12 2.25l2.28 4.88" /></svg>
                  </span>
                  <input type="text" value={item.name || ""} onChange={e => onUpdate("name", e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0B1220] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Skill Name *" />
                  {!item.name && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400/60 text-[10px]">*</span>}
                </div>
                {/* Category */}
                <div className="relative group/input">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 group-focus-within/input:opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                  </span>
                  <input type="text" value={item.category || ""} onChange={e => onUpdate("category", e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0B1220] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Category" />
                </div>
                {/* Years */}
                <div className="relative group/input">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 group-focus-within/input:opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  <input type="text" value={item.years || ""} onChange={e => onUpdate("years", e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0B1220] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Years of Experience *" />
                  {!item.years && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400/60 text-[10px]">*</span>}
                </div>
                {/* Proficiency dropdown */}
                <ProficiencyDropdown value={item.level} onChange={v => onUpdate("level", v)} />
              </div>
              {/* Notes textarea */}
              <div>
                <span className="text-[10px] font-medium text-slate-500 mb-1.5 block">Notes (optional)</span>
                <textarea value={item.notes || ""} onChange={e => onUpdate("notes", e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all min-h-[0px] resize-y"
                  placeholder="Additional notes about this skill..." />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Live Preview (A4 paper mockup) ── */
function ResumePreview({ resume, template }: { resume: Resume; template: ResumeTemplate }) {
  const c = template.colors;
  const fontFamily = TEMPLATE_FONTS[template.font];
  const empty = !resume.name && !resume.title && !resume.email && !resume.summary;

  return (
    <div className="bg-white text-black rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden" style={{ fontFamily }}>
      <div className="p-4 w-[280px] space-y-2.5 text-[10px]">
        {empty ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <p className="text-xs text-slate-400 font-medium">Preview</p>
            <p className="text-[10px] text-slate-300 mt-1">Add details to populate</p>
          </div>
        ) : (
          <>
            <div className="text-center pb-2 mb-2" style={{ borderBottom: `1px solid ${c.border}` }}>
              <h1 className="text-sm font-bold" style={{ color: c.text }}>{resume.name || "Your Name"}</h1>
              <p className="text-[11px]" style={{ color: c.muted }}>{resume.title || "Professional Title"}</p>
              <div className="flex flex-wrap justify-center gap-x-2 text-[8px] mt-1" style={{ color: c.muted }}>
                {resume.email && <span>{resume.email}</span>}
                {resume.phone && <span>{resume.phone}</span>}
                {resume.address && <span>{resume.address}</span>}
              </div>
            </div>
            {resume.summary && (
              <div><h2 className="text-[10px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: c.sectionTitle, borderColor: c.border }}>Summary</h2>
                <p className="leading-relaxed" style={{ color: c.text }}>{resume.summary}</p>
              </div>
            )}
            {resume.experience.length > 0 && (
              <div><h2 className="text-[10px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: c.sectionTitle, borderColor: c.border }}>Experience</h2>
                {resume.experience.slice(0, 2).map(exp => (
                  <div key={exp.id} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-semibold" style={{ color: c.text }}>{exp.position} — {exp.company}</span>
                      <span className="text-[8px] shrink-0 ml-1" style={{ color: c.muted }}>{exp.duration}</span>
                    </div>
                    {exp.description && <p className="text-[8px] mt-0.5 leading-relaxed" style={{ color: c.muted }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {resume.education.length > 0 && (
              <div><h2 className="text-[10px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: c.sectionTitle, borderColor: c.border }}>Education</h2>
                {resume.education.slice(0, 1).map(edu => (
                  <div key={edu.id} className="flex justify-between items-start">
                    <span className="text-[10px] font-semibold" style={{ color: c.text }}>{edu.school}</span>
                    <span className="text-[8px] shrink-0 ml-1" style={{ color: c.muted }}>{edu.year}</span>
                  </div>
                ))}
              </div>
            )}
            {resume.skills.length > 0 && (
              <div><h2 className="text-[10px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ color: c.sectionTitle, borderColor: c.border }}>Skills</h2>
                <div className="flex flex-wrap gap-1">
                  {resume.skills.slice(0, 4).map(skill => (
                    <span key={skill.id} className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${c.primary}15`, color: c.primary }}>{skill.name}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="h-1 bg-gradient-to-b from-black/[0.04] to-transparent" />
    </div>
  );
}

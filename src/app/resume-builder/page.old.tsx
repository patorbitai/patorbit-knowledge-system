"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import ProficiencyDropdown from "@/components/ui/ProficiencyDropdown";
import { validateAll, getFieldError, type ValidationErrors, type ArrayValidationErrors, type TouchedFields } from "@/utils/validation";
import { parseResumeJson } from "@/utils/resume-schema";
import { exportToPdf } from "@/utils/export";
import { loadResume, type Resume } from "@/components/resume/ResumePreview";

/* ── Types ── */
interface Experience { id: number; company: string; position: string; location: string; employmentType: string; industry: string; duration: string; description: string; achievements: string; techUsed: string; }
interface Education { id: number; school: string; degree: string; year: string; field: string; gpa: string; minor: string; honors: string; activities: string; location: string; }
interface Skill { id: number; name: string; level: "Beginner" | "Intermediate" | "Advanced" | "Expert"; category: string; years: string; }
interface Project { id: number; name: string; description: string; tech: string; link: string; startDate: string; endDate: string; role: string; teamSize: string; status: "Completed" | "In Progress" | "Ongoing"; }
interface Certification { id: number; name: string; issuer: string; date: string; link: string; description: string; expiryDate: string; skills: string; }
interface SocialLinks { linkedin: string; github: string; website: string; twitter: string; portfolio: string; stackoverflow: string; }

const defaultResume: Resume = {
  name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [], education: [], skills: [], projects: [], certifications: [],
  languages: [], interests: [], achievements: [], references: [],
  templateId: "modern-clean",
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
const SCROLL_POS_KEY = "patorbit-builder-scroll";

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
  user: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
  mail: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>,
  phone: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>,
  company: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5"/></svg>,
  position: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"/></svg>,
  location: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>,
  time: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  school: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"/></svg>,
  degree: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"/></svg>,
  tech: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>,
  link: <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.572a3.845 3.845 0 00-4.06-.86L7.652 7.652"/></svg>,
};

/* ── Main component ── */
export default function ResumeBuilderPage() {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("unsaved");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [errors, setErrors] = useState<Record<string, ValidationErrors | ArrayValidationErrors>>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const initTouched = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load from localStorage and restore scroll
  useEffect(() => {
    const saved = loadResume();
    if (saved) setResume(saved);
    const savedScroll = sessionStorage.getItem(SCROLL_POS_KEY);
    if (scrollAreaRef.current && savedScroll) {
      requestAnimationFrame(() => {
        scrollAreaRef.current!.scrollTop = Number(savedScroll);
      });
    }
  }, []);

  // Validate and autosave
  const validate = useCallback(() => {
    if (!initTouched.current) return;
    const allErrors = validateAll(resume as any, {
      experience: resume.experience as any,
      education: resume.education as any,
      skills: resume.skills as any,
      projects: resume.projects as any,
      certifications: resume.certifications as any,
    });
    setErrors(allErrors);
  }, [resume]);

  useEffect(() => {
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
  }, [resume, validate]);

  // Save scroll position
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const handleScroll = () => sessionStorage.setItem(SCROLL_POS_KEY, String(el.scrollTop));
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

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

  const progressPct = calcProgress(resume);

  return (
    <main className="min-h-screen bg-[#070B14] text-white flex flex-col">
      {/* ── Sticky Action Bar ── */}
      <div className="sticky top-16 z-30 bg-[#070B14]/70 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-white tracking-tight">Resume Builder</h1>
              <div className="h-3 w-px bg-white/[0.1]" />
              <p className="text-xs text-slate-500 font-medium">
                Step {SECTIONS.findIndex(s => s.id === activeSection) + 1} of {SECTIONS.length}
                <span className="text-slate-700 mx-1.5">&middot;</span>
                {progressPct}% Complete
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-medium hidden md:inline", saveStatus === "saved" && "text-emerald-500/70", saveStatus === "saving" && "text-amber-400/70", saveStatus === "unsaved" && "text-slate-500")}>
                {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
              </span>
              <button onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(resume)); setSaveStatus("saved"); }}
                className="group hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-400 text-[11px] font-medium hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-slate-200 transition-all shadow-sm">
                <svg className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Save
              </button>
              <Link href="/resume-builder/preview"
                className="group hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-400 text-[11px] font-medium hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-slate-200 transition-all shadow-sm">
                <svg className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Preview
              </Link>
              <button onClick={() => setShowImportModal(true)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-400 text-[11px] font-medium hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-slate-200 transition-all shadow-sm">
                <svg className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>
                Import
              </button>
              {/* Reset */}
              <button onClick={() => setShowResetConfirm(true)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/15 bg-red-500/5 text-red-400 text-[11px] font-medium hover:bg-red-500/15 hover:border-red-500/25 transition-all shadow-sm">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Reset
              </button>
              <div className="w-px h-4 bg-white/[0.06] mx-1" />
              <Link href="/resume-builder/preview"
                className="group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30">
                Continue
                <svg className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable Form Area ── */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Section Pills */}
          <div className="flex gap-1 overflow-x-auto pb-4 scrollbar-none">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => { document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveSection(s.id); }}
                className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                  activeSection === s.id ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/[0.04] text-slate-400 border border-transparent hover:bg-white/[0.08]")}>
                <span className="mr-1">{s.icon}</span>{s.label}
              </button>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-14">
            {SECTIONS.map(section => {
              const isExp = section.id === "experience";
              const isEdu = section.id === "education";
              const isSkill = section.id === "skills";
              const isProj = section.id === "projects";
              const isCert = section.id === "certifications";
              const helper = isExp ? expHelper : isEdu ? eduHelper : isSkill ? skillHelper : isProj ? projHelper : certHelper;
              const items = isExp ? resume.experience : isEdu ? resume.education : isSkill ? resume.skills : isProj ? resume.projects : resume.certifications;
              const titles: Record<string, string> = { personal: "Personal Information", experience: "Experience", education: "Education", skills: "Skills", projects: "Projects", certifications: "Certifications" };
              const subtitles: Record<string, string> = { personal: "Your basic contact details and professional summary", experience: "Your work history", education: "Academic background", skills: "Technical & professional skills", projects: "Notable projects", certifications: "Professional certifications" };

              return (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-semibold text-white">{titles[section.id]}</h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
                    </div>
                    <p className="text-sm text-slate-500">{subtitles[section.id]}</p>
                  </div>

                  {section.id === "personal" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      <Field icon={I.user} value={resume.name} onChange={v => updateField("name", v)} onBlur={() => handleBlur("name", "personal")} placeholder="Full Name" type="name" error={getError("name", "personal")} />
                      <Field icon={I.position} value={resume.title} onChange={v => updateField("title", v)} placeholder="Professional Title" type="name" />
                      <Field icon={I.mail} value={resume.email} onChange={v => updateField("email", v)} onBlur={() => handleBlur("email", "personal")} placeholder="Email Address" type="email" error={getError("email", "personal")} />
                      <Field icon={I.phone} value={resume.phone} onChange={v => updateField("phone", v)} onBlur={() => handleBlur("phone", "personal")} placeholder="Phone Number" type="tel" error={getError("phone", "personal")} />
                      <Field icon={I.location} value={resume.address} onChange={v => updateField("address", v)} placeholder="Location" />
                      <div className="col-span-full">
                        <label className="block text-xs font-medium text-slate-400 mb-2">Professional Summary</label>
                        <textarea value={resume.summary} onChange={e => updateField("summary", e.target.value)}
                          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all min-h-[100px] resize-y"
                          placeholder="Write a brief summary of your background and career goals..." />
                      </div>
                      <div className="col-span-full">
                        <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Online Presence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <SocialInput icon={<svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>} value={resume.social.linkedin} onChange={v => updateSocial("linkedin", v)} placeholder="LinkedIn" />
                          <SocialInput icon={<svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>} value={resume.social.github} onChange={v => updateSocial("github", v)} placeholder="GitHub" />
                          <SocialInput icon={<svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>} value={resume.social.website} onChange={v => updateSocial("website", v)} placeholder="Website" />
                        </div>
                      </div>
                    </div>
                  )}

                  {isExp && <SectionItems items={resume.experience} helper={expHelper} sectionKey="experience" title="Experience" handleBlur={handleBlur} getError={getError} renderFields={(item: Experience, i) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                      <ItemField icon={I.company} value={item.company} onChange={v => helper.update(item.id, "company", v)} onBlur={() => handleBlur("company", "experience", i)} placeholder="Company Name" error={getError("company", "experience", i)} />
                      <ItemField icon={I.position} value={item.position} onChange={v => helper.update(item.id, "position", v)} onBlur={() => handleBlur("position", "experience", i)} placeholder="Position" error={getError("position", "experience", i)} />
                      <ItemField icon={I.location} value={item.location} onChange={v => helper.update(item.id, "location", v)} placeholder="Location" />
                      <ItemField icon={I.time} value={item.duration} onChange={v => helper.update(item.id, "duration", v)} placeholder="Duration (e.g. Jan 2020 - Present)" />
                      <div className="col-span-full">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                        <textarea value={item.description} onChange={e => helper.update(item.id, "description", e.target.value)}
                          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all min-h-[80px] resize-y"
                          placeholder="• Describe your responsibilities and achievements&#10;• Start each bullet point with • for formatting" />
                      </div>
                    </div>
                  )} />}

                  {isEdu && <SectionItems items={resume.education} helper={eduHelper} sectionKey="education" title="Education" handleBlur={handleBlur} getError={getError} renderFields={(item: Education, i) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                      <ItemField icon={I.school} value={item.school} onChange={v => helper.update(item.id, "school", v)} onBlur={() => handleBlur("school", "education", i)} placeholder="School / University" error={getError("school", "education", i)} />
                      <ItemField icon={I.degree} value={item.degree} onChange={v => helper.update(item.id, "degree", v)} onBlur={() => handleBlur("degree", "education", i)} placeholder="Degree" error={getError("degree", "education", i)} />
                      <ItemField value={item.field} onChange={v => helper.update(item.id, "field", v)} placeholder="Field of Study" />
                      <ItemField value={item.gpa} onChange={v => helper.update(item.id, "gpa", v)} placeholder="GPA" />
                    </div>
                  )} />}

                  {isSkill && <SkillSection items={resume.skills} helper={skillHelper} handleBlur={handleBlur} getError={getError} />}

                  {isProj && <SectionItems items={resume.projects} helper={projHelper} sectionKey="projects" title="Projects" handleBlur={handleBlur} getError={getError} renderFields={(item: Project, i) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                      <ItemField value={item.name} onChange={v => helper.update(item.id, "name", v)} onBlur={() => handleBlur("name", "projects", i)} placeholder="Project Name" error={getError("name", "projects", i)} />
                      <ItemField icon={I.tech} value={item.tech} onChange={v => helper.update(item.id, "tech", v)} placeholder="Technologies Used" />
                      <ItemField value={item.role} onChange={v => helper.update(item.id, "role", v)} onBlur={() => handleBlur("role", "projects", i)} placeholder="Role" />
                      <ItemField icon={I.link} value={item.link} onChange={v => helper.update(item.id, "link", v)} placeholder="Project Link" />
                      <div className="col-span-full">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                        <textarea value={item.description} onChange={e => helper.update(item.id, "description", e.target.value)}
                          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all min-h-[80px] resize-y"
                          placeholder="• Describe the project and your contributions" />
                      </div>
                    </div>
                  )} />}

                  {isCert && <SectionItems items={resume.certifications} helper={certHelper} sectionKey="certifications" title="Certifications" handleBlur={handleBlur} getError={getError} renderFields={(item: Certification, i) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                      <ItemField value={item.name} onChange={v => helper.update(item.id, "name", v)} onBlur={() => handleBlur("name", "certifications", i)} placeholder="Certification Name" error={getError("name", "certifications", i)} />
                      <ItemField value={item.issuer} onChange={v => helper.update(item.id, "issuer", v)} placeholder="Issuer" />
                      <ItemField value={item.date} onChange={v => helper.update(item.id, "date", v)} placeholder="Date" />
                      <ItemField icon={I.link} value={item.link} onChange={v => helper.update(item.id, "link", v)} placeholder="Credential Link" />
                      <div className="col-span-full">
                        <textarea value={item.description} onChange={e => helper.update(item.id, "description", e.target.value)}
                          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all min-h-[60px] resize-y"
                          placeholder="Optional description" />
                      </div>
                    </div>
                  )} />}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 mb-6 flex flex-col sm:flex-row items-center justify-center gap-4 p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
            <p className="text-sm text-slate-400">Ready to see how your resume looks?</p>
            <Link href="/resume-builder/preview"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/20">
              Preview Resume
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(data) => { setResume(data as Resume); setShowImportModal(false); }}
        />
      )}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowResetConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1629] border border-white/[0.08] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
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

/* ── SectionItems ── */
function SectionItems<T extends { id: number }>({ items, helper, sectionKey, handleBlur, getError, renderFields }: {
  items: T[];
  helper: { add: () => void; update: (id: number, field: string, value: any) => void; remove: (id: number) => void; move: (id: number, dir: -1 | 1) => void };
  sectionKey: string;
  title: string;
  handleBlur: (field: string, section: string, index?: number) => void;
  getError: (field: string, section: string, index?: number) => string | undefined;
  renderFields: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{items.length} {items.length === 1 ? "entry" : "entries"}</span>
        <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-sm text-slate-400 mb-1">No entries yet</p>
          <p className="text-xs text-slate-500 mb-5">Add your first entry to get started</p>
          <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Entry
          </button>
        </div>
      ) : (
        items.map((item: T, i: number) => (
          <div key={(item as any).id} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6 hover:border-white/[0.1] transition-all">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold">{i + 1}</span>
                <span className="text-sm font-medium text-slate-200">Entry {i + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => helper.move((item as any).id, -1)} disabled={i === 0} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/[0.06] transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button onClick={() => helper.move((item as any).id, 1)} disabled={i === items.length - 1} className="p-1.5 text-slate-500 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/[0.06] transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button onClick={() => helper.remove((item as any).id)} className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            {renderFields(item, i)}
          </div>
        ))
      )}
    </div>
  );
}

/* ── Skill Section ── */
function SkillSection({ items, helper, handleBlur, getError }: {
  items: Skill[];
  helper: { add: () => void; update: (id: number, field: string, value: any) => void; remove: (id: number) => void; move: (id: number, dir: -1 | 1) => void };
  handleBlur: (field: string, section: string, index?: number) => void;
  getError: (field: string, section: string, index?: number) => string | undefined;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{items.length} {items.length === 1 ? "skill" : "skills"}</span>
        <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Skill
        </button>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-sm text-slate-400 mb-1">No skills added yet</p>
          <p className="text-xs text-slate-500 mb-5">Add your key technical and professional skills</p>
          <button onClick={helper.add} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all">
            Add Skill
          </button>
        </div>
      ) : (
        items.map((item, i) => (
          <div key={item.id} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1.5">Skill *</label>
                <input value={item.name} onChange={e => helper.update(item.id, "name", e.target.value)} onBlur={() => handleBlur("name", "skills", i)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500" placeholder="React" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1.5">Category</label>
                <input value={item.category} onChange={e => helper.update(item.id, "category", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500" placeholder="Frontend" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1.5">Years</label>
                <input value={item.years} onChange={e => helper.update(item.id, "years", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500" placeholder="3" />
              </div>
              <div>
                <ProficiencyDropdown id={`skill-${item.id}`} value={item.level} onChange={v => helper.update(item.id, "level", v)} />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={() => helper.remove(item.id)} className="px-2.5 py-1 rounded-lg text-red-400 text-xs hover:bg-red-500/10 transition-colors">Remove</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ── Sub-components ── */
function Field({ icon, value, onChange, onBlur, placeholder, type = "text", error }: {
  icon?: React.ReactNode; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string; type?: string; error?: string;
}) {
  return (
    <div>
      <div className="relative group">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity">{icon}</span>}
        <input type={type === "name" ? "text" : type} value={value || ""} onChange={e => onChange(sanitize(e.target.value, type))} onBlur={onBlur}
          className={clsx("w-full bg-white/[0.04] border rounded-xl text-sm text-white focus:ring-1 focus:outline-none placeholder:text-slate-500 transition-all", icon ? "pl-10 pr-3.5 py-3" : "px-4 py-3",
            error ? "border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20" : "border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/20")}
          placeholder={placeholder} autoComplete="off" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function ItemField({ icon, value, onChange, onBlur, placeholder, type = "text", error }: {
  icon?: React.ReactNode; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string; type?: string; error?: string;
}) {
  return (
    <div>
      <div className="relative group">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity">{icon}</span>}
        <input type={type === "name" ? "text" : type} value={value || ""} onChange={e => onChange(sanitize(e.target.value, type))} onBlur={onBlur}
          className={clsx("w-full bg-white/[0.04] border rounded-xl text-sm text-white focus:ring-1 focus:outline-none placeholder:text-slate-500 transition-all", icon ? "pl-9 pr-3 py-2.5" : "px-3.5 py-2.5",
            error ? "border-red-500/50 focus:border-red-500/80" : "border-white/[0.06] focus:border-blue-500/50 focus:ring-blue-500/20")}
          placeholder={placeholder} autoComplete="off" />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function SocialInput({ icon, value, onChange, placeholder }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative group">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity">{icon}</span>
      <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none placeholder:text-slate-500 transition-all"
        placeholder={placeholder} autoComplete="off" />
    </div>
  );
}

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (resume: Resume) => void }) {
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
    if (!file) { setError("Please select a file to import."); return; }
    setIsParsing(true); setError(null);
    if (file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try { const text = e.target?.result as string; const data = JSON.parse(text); const validatedData = parseResumeJson(data); onImport(validatedData as Resume); }
        catch (err: any) { setError(err.message || "Failed to parse JSON."); } finally { setIsParsing(false); }
      };
      reader.onerror = () => { setError("Failed to read the file."); setIsParsing(false); };
      reader.readAsText(file);
    } else {
      const formData = new FormData(); formData.append("file", file);
      try {
        const response = await fetch("/api/import", { method: "POST", body: formData });
        if (!response.ok) { const err = await response.json(); throw new Error(err.error || `Server error: ${response.status}`); }
        const data = await response.json(); const validatedData = parseResumeJson(data); onImport(validatedData as Resume);
      } catch (err: any) { setError(err.message || "An unknown error occurred."); } finally { setIsParsing(false); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F1629] border border-white/[0.08] rounded-2xl p-6 max-w-md mx-4 shadow-2xl w-full" onClick={e => e.stopPropagation()}>
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
          <button onClick={handleImportClick} disabled={isParsing || !file} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold transition-all disabled:opacity-50">
            {isParsing ? "Importing..." : "Import"}
          </button>
        </div>
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
    default: return value;
  }
}

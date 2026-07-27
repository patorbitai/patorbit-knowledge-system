"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { TEMPLATES, TEMPLATE_FONTS, type ResumeTemplate } from "./templates";

/* ── Types ── */
interface Experience {
  id: number;
  company: string;
  position: string;
  location: string;
  employmentType: string;
  industry: string;
  duration: string;
  description: string;
  achievements: string;
  techUsed: string;
}
interface Education {
  id: number;
  school: string;
  degree: string;
  year: string;
  field: string;
  gpa: string;
  minor: string;
  honors: string;
  activities: string;
  location: string;
}
interface Skill {
  id: number;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  category: string;
  years: string;
}
interface Project {
  id: number;
  name: string;
  description: string;
  tech: string;
  link: string;
  startDate: string;
  endDate: string;
  role: string;
  teamSize: string;
  status: "Completed" | "In Progress" | "Ongoing";
}
interface Certification {
  id: number;
  name: string;
  issuer: string;
  date: string;
  link: string;
  description: string;
  expiryDate: string;
  skills: string;
}
interface SocialLinks {
  linkedin: string;
  github: string;
  website: string;
  twitter: string;
  portfolio: string;
  stackoverflow: string;
}
interface Resume {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  pronouns: string;
  summary: string;
  social: SocialLinks;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  templateId: string;
}

const defaultResume: Resume = {
  name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [], education: [], skills: [], projects: [], certifications: [],
  templateId: TEMPLATES[0].id,
};

const SECTIONS = [
  { id: "personal",   label: "Personal Info",  icon: "👤" },
  { id: "experience", label: "Experience",     icon: "💼" },
  { id: "education",  label: "Education",      icon: "🎓" },
  { id: "skills",     label: "Skills",         icon: "⚡" },
  { id: "projects",   label: "Projects",       icon: "📁" },
  { id: "certifications", label: "Certifications", icon: "🏅" },
] as const;

/* ── Helpers ── */
const STORAGE_KEY = "patorbit-resume-data";

function loadResume(): Resume {
  if (typeof window === "undefined") return defaultResume;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultResume, ...parsed, templateId: parsed.templateId || TEMPLATES[0].id };
    }
  } catch { /* ignore */ }
  return defaultResume;
}

function reorderItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const copy = [...items];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

/* ── Component ── */
export default function ResumeBuilderPage() {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("unsaved");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

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

  const updateField = useCallback(<K extends keyof Resume>(key: K, value: Resume[K]) => {
    setResume(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSocial = (key: keyof SocialLinks, value: string) => {
    setResume(prev => ({ ...prev, social: { ...prev.social, [key]: value } }));
  };

  const setTemplate = (templateId: string) => { setResume(prev => ({ ...prev, templateId })); setShowTemplatePicker(false); };
  const downloadPDF = () => window.print();
  const resetResume = () => { localStorage.removeItem(STORAGE_KEY); setResume(defaultResume); setShowResetConfirm(false); };

  const arrayHelpers = <T extends { id: number }>(key: keyof Resume, emptyItem: Omit<T, 'id'>) => ({
    add: () => setResume(prev => ({ ...prev, [key]: [...((prev[key] ?? []) as unknown as T[]), { ...emptyItem, id: Date.now() } as T] })),
    update: (id: number, field: keyof T, value: string) => setResume(prev => ({ ...prev, [key]: ((prev[key] ?? []) as unknown as T[]).map(item => item.id === id ? { ...item, [field]: value } : item) })),
    remove: (id: number) => setResume(prev => ({ ...prev, [key]: ((prev[key] ?? []) as unknown as T[]).filter(item => item.id !== id) })),
    move: (id: number, dir: -1 | 1) => setResume(prev => { const items = (prev[key] ?? []) as unknown as T[]; const idx = items.findIndex(item => item.id === id); return { ...prev, [key]: reorderItem(items, idx, idx + dir) }; }),
  });

  const expHelper = arrayHelpers<Experience>("experience", { company: "", position: "", location: "", employmentType: "", industry: "", duration: "", description: "", achievements: "", techUsed: "" });
  const eduHelper = arrayHelpers<Education>("education", { school: "", degree: "", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" });
  const skillHelper = arrayHelpers<Skill>("skills", { name: "", level: "Intermediate", category: "", years: "" });
  const projHelper = arrayHelpers<Project>("projects", { name: "", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" });
  const certHelper = arrayHelpers<Certification>("certifications", { name: "", issuer: "", date: "", link: "", description: "", expiryDate: "", skills: "" });

  const activeTemplate = TEMPLATES.find(t => t.id === resume.templateId) || TEMPLATES[0];

  return (
    <main className="min-h-screen bg-slate-950 text-white print:bg-white print:text-black">
      {/* ── Page Header ── */}
      <section className="pt-24 pb-4 border-b border-white/10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Resume Builder</h1>
              <p className="text-slate-400 text-sm mt-0.5">Build your professional resume</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium",
                saveStatus === "saved" && "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
                saveStatus === "saving" && "text-amber-400 bg-amber-500/10 border border-amber-500/20",
                saveStatus === "unsaved" && "text-slate-500 bg-slate-800 border border-white/10",
              )}>
                {saveStatus === "saved" ? "✓ Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
              </span>

              <div className="relative">
                <button onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1.5">
                  <span>{activeTemplate.preview}</span>
                  <span className="hidden sm:inline">{activeTemplate.name}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showTemplatePicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTemplatePicker(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-h-72 overflow-y-auto p-1.5">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => setTemplate(t.id)}
                          className={clsx("w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-colors text-xs",
                            resume.templateId === t.id ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300 hover:bg-slate-800")}>
                          <span className="text-base">{t.preview}</span>
                          <span className="font-medium">{t.name}</span>
                          {resume.templateId === t.id && <svg className="w-3.5 h-3.5 ml-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button onClick={downloadPDF}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M12 11v5m0 0l-2-2m2 2l2-2" />
                </svg>
                PDF
              </button>

              <button onClick={() => setShowResetConfirm(true)}
                className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:py-0 print:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 print:block">
          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 print:hidden">
            <div className="bg-slate-900/80 rounded-xl border border-white/10 p-3 sticky top-24">
              <nav className="space-y-0.5">
                {SECTIONS.map(section => (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={clsx("w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2.5 text-xs font-medium",
                      activeSection === section.id
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30"
                        : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                    <span className="text-base">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* ── Form Area ── */}
          <div className="lg:col-span-2 print:hidden">
            <div className="bg-slate-900/80 rounded-xl border border-white/10 p-5 sm:p-6 min-h-[500px]">
              <AnimatePresence mode="wait">
                {activeSection === "personal" && (
                  <motion.div key="personal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <SectionHeader title="Personal Info" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <Input value={resume.name} onChange={v => updateField("name", v)} placeholder="Full Name" />
                      <Input value={resume.title} onChange={v => updateField("title", v)} placeholder="Professional Title" />
                      <Input value={resume.email} onChange={v => updateField("email", v)} placeholder="Email Address" type="email" />
                      <Input value={resume.phone} onChange={v => updateField("phone", v)} placeholder="Phone Number" type="tel" />
                      <Input value={resume.address} onChange={v => updateField("address", v)} placeholder="Location / Address" />
                      <Input value={resume.nationality} onChange={v => updateField("nationality", v)} placeholder="Nationality" />
                      <Input value={resume.pronouns} onChange={v => updateField("pronouns", v)} placeholder="Pronouns (he/him, she/her)" />
                      <div className="col-span-full">
                        <h3 className="text-xs font-semibold text-slate-400 mb-2.5 mt-1 uppercase tracking-wider">Online Presence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input value={resume.social.linkedin} onChange={v => updateSocial("linkedin", v)} placeholder="LinkedIn URL" small />
                          <Input value={resume.social.github} onChange={v => updateSocial("github", v)} placeholder="GitHub URL" small />
                          <Input value={resume.social.website} onChange={v => updateSocial("website", v)} placeholder="Personal Website" small />
                          <Input value={resume.social.twitter} onChange={v => updateSocial("twitter", v)} placeholder="Twitter / X Profile" small />
                          <Input value={resume.social.portfolio} onChange={v => updateSocial("portfolio", v)} placeholder="Portfolio / Behance" small />
                          <Input value={resume.social.stackoverflow} onChange={v => updateSocial("stackoverflow", v)} placeholder="Stack Overflow" small />
                        </div>
                      </div>
                      <div className="col-span-full">
                        <label className="block text-xs font-medium mb-1.5 text-slate-400">Professional Summary</label>
                        <textarea value={resume.summary} onChange={e => updateField("summary", e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors min-h-[90px] resize-y placeholder:text-slate-500"
                          placeholder="Write a brief summary of your background, key achievements, and career goals..." />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSection === "experience" && (
                  <FormSection title="Experience" onAdd={expHelper.add} empty={!resume.experience.length} emptyMsg="No experience added yet.">
                    {resume.experience.map((exp, i) => (
                      <FormCard key={exp.id} index={i} total={resume.experience.length} title="Experience"
                        onRemove={() => expHelper.remove(exp.id)} onMoveUp={() => expHelper.move(exp.id, -1)} onMoveDown={() => expHelper.move(exp.id, 1)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input value={exp.company} onChange={v => expHelper.update(exp.id, "company", v)} placeholder="Company Name" small />
                          <Input value={exp.position} onChange={v => expHelper.update(exp.id, "position", v)} placeholder="Job Title" small />
                          <Input value={exp.location} onChange={v => expHelper.update(exp.id, "location", v)} placeholder="Location" small />
                          <Input value={exp.duration} onChange={v => expHelper.update(exp.id, "duration", v)} placeholder="Duration (Jan 2020 — Present)" small />
                          <select value={exp.employmentType} onChange={e => expHelper.update(exp.id, "employmentType", e.target.value)}
                            className="px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none">
                            <option value="">Employment Type</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Internship">Internship</option>
                          </select>
                          <Input value={exp.industry} onChange={v => expHelper.update(exp.id, "industry", v)} placeholder="Industry (Tech, Finance...)" small />
                          <div className="col-span-full">
                            <label className="block text-xs font-medium mb-1 text-slate-400">Technologies Used</label>
                            <input value={exp.techUsed} onChange={e => expHelper.update(exp.id, "techUsed", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                              placeholder="React, Node.js, AWS, PostgreSQL" />
                          </div>
                          <div className="col-span-full">
                            <label className="block text-xs font-medium mb-1 text-slate-400">Description</label>
                            <textarea value={exp.description} onChange={e => expHelper.update(exp.id, "description", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none min-h-[55px] resize-y"
                              placeholder="Brief overview of your role and responsibilities..." />
                          </div>
                          <div className="col-span-full">
                            <label className="block text-xs font-medium mb-1 text-slate-400">Key Achievements</label>
                            <textarea value={exp.achievements} onChange={e => expHelper.update(exp.id, "achievements", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none min-h-[55px] resize-y"
                              placeholder="• Increased team velocity by 40% through CI/CD improvements" />
                          </div>
                        </div>
                      </FormCard>
                    ))}
                  </FormSection>
                )}

                {activeSection === "education" && (
                  <FormSection title="Education" onAdd={eduHelper.add} empty={!resume.education.length} emptyMsg="No education added yet.">
                    {resume.education.map((edu, i) => (
                      <FormCard key={edu.id} index={i} total={resume.education.length} title="Education"
                        onRemove={() => eduHelper.remove(edu.id)} onMoveUp={() => eduHelper.move(edu.id, -1)} onMoveDown={() => eduHelper.move(edu.id, 1)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input value={edu.school} onChange={v => eduHelper.update(edu.id, "school", v)} placeholder="School / University" small />
                          <Input value={edu.location} onChange={v => eduHelper.update(edu.id, "location", v)} placeholder="Location" small />
                          <Input value={edu.degree} onChange={v => eduHelper.update(edu.id, "degree", v)} placeholder="Degree (B.S., M.S.)" small />
                          <Input value={edu.field} onChange={v => eduHelper.update(edu.id, "field", v)} placeholder="Field of Study" small />
                          <Input value={edu.minor} onChange={v => eduHelper.update(edu.id, "minor", v)} placeholder="Minor (optional)" small />
                          <Input value={edu.gpa} onChange={v => eduHelper.update(edu.id, "gpa", v)} placeholder="GPA (optional)" small />
                          <Input value={edu.year} onChange={v => eduHelper.update(edu.id, "year", v)} placeholder="Graduation Year" small />
                          <div className="col-span-full">
                            <Input value={edu.honors} onChange={v => eduHelper.update(edu.id, "honors", v)} placeholder="Honors / Awards (optional)" small />
                          </div>
                          <div className="col-span-full">
                            <label className="block text-xs font-medium mb-1 text-slate-400">Activities (optional)</label>
                            <input value={edu.activities} onChange={e => eduHelper.update(edu.id, "activities", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none"
                              placeholder="Student clubs, sports, volunteering..." />
                          </div>
                        </div>
                      </FormCard>
                    ))}
                  </FormSection>
                )}

                {activeSection === "skills" && (
                  <FormSection title="Skills" onAdd={skillHelper.add} empty={!resume.skills.length} emptyMsg="No skills added yet.">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {resume.skills.map((skill, i) => (
                        <FormCard key={skill.id} index={i} total={resume.skills.length} title="Skill"
                          onRemove={() => skillHelper.remove(skill.id)} onMoveUp={() => skillHelper.move(skill.id, -1)} onMoveDown={() => skillHelper.move(skill.id, 1)} compact>
                          <div className="space-y-2.5">
                            <Input value={skill.name} onChange={v => skillHelper.update(skill.id, "name", v)} placeholder="Skill Name" small />
                            <Input value={skill.category} onChange={v => skillHelper.update(skill.id, "category", v)} placeholder="Category (Frontend, Backend)" small />
                            <Input value={skill.years} onChange={v => skillHelper.update(skill.id, "years", v)} placeholder="Years of Experience" small />
                            <div>
                              <label className="block text-[10px] font-medium mb-1 text-slate-500">Proficiency</label>
                              <select value={skill.level} onChange={e => skillHelper.update(skill.id, "level", e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none">
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                              </select>
                            </div>
                          </div>
                        </FormCard>
                      ))}
                    </div>
                  </FormSection>
                )}

                {activeSection === "projects" && (
                  <FormSection title="Projects" onAdd={projHelper.add} empty={!resume.projects.length} emptyMsg="No projects added yet.">
                    {resume.projects.map((proj, i) => (
                      <FormCard key={proj.id} index={i} total={resume.projects.length} title="Project"
                        onRemove={() => projHelper.remove(proj.id)} onMoveUp={() => projHelper.move(proj.id, -1)} onMoveDown={() => projHelper.move(proj.id, 1)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input value={proj.name} onChange={v => projHelper.update(proj.id, "name", v)} placeholder="Project Name" small />
                          <Input value={proj.role} onChange={v => projHelper.update(proj.id, "role", v)} placeholder="Your Role" small />
                          <Input value={proj.startDate} onChange={v => projHelper.update(proj.id, "startDate", v)} placeholder="Start Date" small />
                          <Input value={proj.endDate} onChange={v => projHelper.update(proj.id, "endDate", v)} placeholder="End Date" small />
                          <Input value={proj.teamSize} onChange={v => projHelper.update(proj.id, "teamSize", v)} placeholder="Team Size" small />
                          <select value={proj.status} onChange={e => projHelper.update(proj.id, "status", e.target.value)}
                            className="px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none">
                            <option value="Completed">Completed</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Ongoing">Ongoing</option>
                          </select>
                          <div className="col-span-full">
                            <Input value={proj.tech} onChange={v => projHelper.update(proj.id, "tech", v)} placeholder="Tech Stack Used" small />
                          </div>
                          <div className="col-span-full">
                            <label className="block text-xs font-medium mb-1 text-slate-400">Description</label>
                            <textarea value={proj.description} onChange={e => projHelper.update(proj.id, "description", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none min-h-[55px] resize-y"
                              placeholder="Describe the project, your role, and impact..." />
                          </div>
                          <div className="col-span-full">
                            <Input value={proj.link} onChange={v => projHelper.update(proj.id, "link", v)} placeholder="Project Link (GitHub, demo...)" small />
                          </div>
                        </div>
                      </FormCard>
                    ))}
                  </FormSection>
                )}

                {activeSection === "certifications" && (
                  <FormSection title="Certifications" onAdd={certHelper.add} empty={!resume.certifications.length} emptyMsg="No certifications added yet.">
                    {resume.certifications.map((cert, i) => (
                      <FormCard key={cert.id} index={i} total={resume.certifications.length} title="Certification"
                        onRemove={() => certHelper.remove(cert.id)} onMoveUp={() => certHelper.move(cert.id, -1)} onMoveDown={() => certHelper.move(cert.id, 1)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input value={cert.name} onChange={v => certHelper.update(cert.id, "name", v)} placeholder="Certification Name" small />
                          <Input value={cert.issuer} onChange={v => certHelper.update(cert.id, "issuer", v)} placeholder="Issuing Organization" small />
                          <Input value={cert.date} onChange={v => certHelper.update(cert.id, "date", v)} placeholder="Date Obtained" small />
                          <Input value={cert.expiryDate} onChange={v => certHelper.update(cert.id, "expiryDate", v)} placeholder="Expiry Date (optional)" small />
                          <div className="col-span-full">
                            <Input value={cert.skills} onChange={v => certHelper.update(cert.id, "skills", v)} placeholder="Skills Covered (optional)" small />
                          </div>
                          <div className="col-span-full">
                            <label className="block text-xs font-medium mb-1 text-slate-400">Description (optional)</label>
                            <textarea value={cert.description} onChange={e => certHelper.update(cert.id, "description", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-500 focus:outline-none min-h-[45px] resize-y"
                              placeholder="What this certification covers..." />
                          </div>
                          <div className="col-span-full">
                            <Input value={cert.link} onChange={v => certHelper.update(cert.id, "link", v)} placeholder="Credential Link (optional)" small />
                          </div>
                        </div>
                      </FormCard>
                    ))}
                  </FormSection>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Live Preview ── */}
          <div className="lg:col-span-2 print:col-span-2">
            <div className="sticky top-24 print:static">
              <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4 print:bg-white print:border-none print:p-0 print:shadow-none">
                <p className="text-[10px] text-slate-500 mb-2 print:hidden flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Live preview
                </p>
                <ResumePreview resume={resume} template={activeTemplate} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reset Confirmation ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 print:hidden">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 rounded-xl p-5 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1.5">Reset Resume?</h3>
            <p className="text-xs text-slate-400 mb-5">This will permanently delete all your data. This cannot be undone.</p>
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-xs font-medium">Cancel</button>
              <button onClick={resetResume}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors text-xs font-semibold">Yes, Reset</button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

/* ── Sub-components ── */

function Input({ value, onChange, placeholder, type = "text", small }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; small?: boolean;
}) {
  return (
    <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
      className={clsx("w-full bg-slate-800 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors placeholder:text-slate-500",
        small ? "px-3 py-2 text-sm" : "px-3.5 py-2.5 text-sm")}
      placeholder={placeholder} />
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-lg font-bold text-white mb-4">{title}</h2>;
}

function FormSection({ title, onAdd, children, empty, emptyMsg }: {
  title: string; onAdd: () => void; children: React.ReactNode; empty: boolean; emptyMsg: string;
}) {
  return (
    <motion.div key={title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button onClick={onAdd}
          className="shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-sm shadow-cyan-500/20">
          + Add
        </button>
      </div>
      <div className="space-y-3">
        {children}
        {empty && <div className="text-center py-8 text-slate-500 text-sm bg-slate-800/30 rounded-lg border border-dashed border-white/10">{emptyMsg}</div>}
      </div>
    </motion.div>
  );
}

function FormCard({ children, onRemove, onMoveUp, onMoveDown, index, total, title, compact }: {
  children: React.ReactNode; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
  index: number; total: number; title: string; compact?: boolean;
}) {
  return (
    <div className={clsx("bg-slate-800/60 rounded-lg border border-white/10 hover:border-white/20 transition-colors", compact ? "p-3" : "p-4")}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">{index + 1}</span>
          {title} {index + 1}
        </h3>
        <div className="flex items-center gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0}
            className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors rounded hover:bg-slate-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors rounded hover:bg-slate-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-300 transition-colors rounded hover:bg-red-500/10 ml-0.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Live Preview ── */
function ResumePreview({ resume, template }: { resume: Resume; template: ResumeTemplate }) {
  const c = template.colors;
  const fontFamily = TEMPLATE_FONTS[template.font];

  const sectionTitle = (text: string) => (
    <h2 className="text-sm font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ color: c.sectionTitle, borderColor: c.border }}>{text}</h2>
  );

  const renderHeader = () => {
    const contacts = [resume.email, resume.phone, resume.address].filter(Boolean);
    const socials = [resume.social.linkedin && "LinkedIn", resume.social.github && "GitHub", resume.social.website && "Website"].filter(Boolean);
    const allLinks = [...contacts, ...(socials.length ? [`(${socials.join(", ")})`] : [])];

    const headerContent = (
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold" style={{ color: c.text }}>{resume.name || "Your Name"}</h1>
        <p className="text-sm" style={{ color: c.muted }}>{resume.title || "Professional Title"}</p>
        {resume.pronouns && <p className="text-[10px]" style={{ color: c.muted }}>{resume.pronouns}</p>}
        {allLinks.length > 0 && <div className="flex flex-wrap gap-x-2.5 text-[10px] mt-1" style={{ color: c.muted }}>{allLinks.map((l, i) => <span key={i}>{l}</span>)}</div>}
      </div>
    );

    if (template.headerStyle === "centered") return <div className="text-center pb-3 mb-3" style={{ borderBottom: `1px solid ${c.border}` }}>{headerContent}</div>;
    if (template.headerStyle === "left-bar") return (
      <div className="flex gap-3 pb-3 mb-3" style={{ borderBottom: `1px solid ${c.border}` }}>
        <div className="w-1 shrink-0 rounded" style={{ backgroundColor: c.primary }} />
        <div className="flex-1">{headerContent}</div>
      </div>
    );
    return (
      <div className="p-4 -m-4 mb-4 rounded-t-lg" style={{ backgroundColor: c.primary }}>
        <div className="space-y-0.5 text-white">
          <h1 className="text-xl font-bold">{resume.name || "Your Name"}</h1>
          <p className="text-sm text-white/80">{resume.title || "Professional Title"}</p>
        </div>
      </div>
    );
  };

  const empty = !resume.name && !resume.title && !resume.email && !resume.summary &&
    !resume.experience.length && !resume.education.length && !resume.skills.length &&
    !resume.projects.length && !resume.certifications.length;

  return (
    <div className="bg-white text-black rounded-lg shadow-sm overflow-hidden print:shadow-none" style={{ fontFamily }}>
      <div className="p-4 sm:p-5 space-y-2.5 text-[11px]">
        {empty ? (
          <div className="text-center py-10 text-slate-400 text-xs">Start adding info to see a live preview</div>
        ) : (
          <>
            {renderHeader()}

            {resume.summary && (
              <div>
                {sectionTitle("Summary")}
                <p className="leading-relaxed" style={{ color: c.text }}>{resume.summary}</p>
              </div>
            )}

            {resume.experience.length > 0 && (
              <div>
                {sectionTitle("Experience")}
                {resume.experience.map(exp => (
                  <div key={exp.id} className="mb-2 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-sm" style={{ color: c.text }}>{exp.position}</span>
                        <span className="text-xs ml-1" style={{ color: c.muted }}>— {exp.company}</span>
                        {exp.location && <span className="text-xs ml-1" style={{ color: c.muted }}>({exp.location})</span>}
                      </div>
                      <span className="text-xs shrink-0 ml-2" style={{ color: c.muted }}>{exp.duration}</span>
                    </div>
                    {exp.description && <p className="mt-0.5 text-xs leading-relaxed" style={{ color: c.muted }}>{exp.description}</p>}
                    {exp.achievements && <p className="mt-0.5 text-xs leading-relaxed" style={{ color: c.muted }}>{exp.achievements}</p>}
                    {exp.techUsed && <p className="mt-0.5 text-[10px] font-medium" style={{ color: c.secondary }}>Tech: {exp.techUsed}</p>}
                  </div>
                ))}
              </div>
            )}

            {resume.education.length > 0 && (
              <div>
                {sectionTitle("Education")}
                {resume.education.map(edu => (
                  <div key={edu.id} className="flex justify-between items-start mb-1 last:mb-0">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: c.text }}>{edu.school}</span>
                      <span className="text-xs ml-1" style={{ color: c.muted }}>— {edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
                      {edu.gpa && <span className="text-xs ml-1.5" style={{ color: c.muted }}>| GPA: {edu.gpa}</span>}
                      {edu.honors && <p className="text-[10px]" style={{ color: c.muted }}>Honors: {edu.honors}</p>}
                    </div>
                    <span className="text-xs shrink-0 ml-2" style={{ color: c.muted }}>{edu.year}</span>
                  </div>
                ))}
              </div>
            )}

            {resume.skills.length > 0 && (
              <div>
                {sectionTitle("Skills")}
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map(skill => (
                    <span key={skill.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${c.primary}15`, color: c.primary }}>
                      {skill.name}
                      {skill.level !== "Intermediate" && <span className="ml-0.5 opacity-60">({skill.level})</span>}
                      {skill.years && <span className="ml-0.5 opacity-60">| {skill.years}y</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resume.projects.length > 0 && (
              <div>
                {sectionTitle("Projects")}
                {resume.projects.map(proj => (
                  <div key={proj.id} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-sm" style={{ color: c.text }}>{proj.name}</span>
                        {proj.role && <span className="text-xs ml-1" style={{ color: c.muted }}>({proj.role})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] shrink-0 ml-2" style={{ color: c.muted }}>
                        {proj.status && proj.status !== "Completed" && <span style={{ color: c.primary }}>{proj.status}</span>}
                        {proj.startDate && <span>{proj.startDate}{proj.endDate ? ` — ${proj.endDate}` : ""}</span>}
                        {proj.link && <a href={proj.link} className="underline" style={{ color: c.primary }}>Link</a>}
                      </div>
                    </div>
                    {proj.tech && <p className="text-[10px] mt-0.5 font-medium" style={{ color: c.secondary }}>{proj.tech}</p>}
                    {proj.description && <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: c.muted }}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {resume.certifications.length > 0 && (
              <div>
                {sectionTitle("Certifications")}
                {resume.certifications.map(cert => (
                  <div key={cert.id} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-sm" style={{ color: c.text }}>{cert.name}</span>
                        <span className="text-xs ml-1" style={{ color: c.muted }}>— {cert.issuer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px]" style={{ color: c.muted }}>{cert.date}</span>
                        {cert.link && <a href={cert.link} className="text-[10px] underline" style={{ color: c.primary }}>Verify</a>}
                      </div>
                    </div>
                    {cert.skills && <p className="text-[10px] mt-0.5" style={{ color: c.muted }}>Skills: {cert.skills}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

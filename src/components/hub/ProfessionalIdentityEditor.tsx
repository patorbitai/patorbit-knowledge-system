"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderKanban,
  Award,
  Globe,
  Trophy,
  Palette,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { ProfileData } from "@/lib/resume-seeding";
import { calculateProfileCompleteness } from "@/lib/resume-seeding";

// Re-export for external consumers
export type { ProfileData };

interface ProfessionalIdentityEditorProps {
  initialData?: ProfileData;
  onSave?: (data: ProfileData) => void;
  onSkip?: () => void;
  showSkip?: boolean;
  compact?: boolean;
}

const DEFAULT_PROFILE: ProfileData = {
  fullName: "",
  headline: "",
  summary: "",
  email: "",
  phone: "",
  location: "",
  nationality: "",
  pronouns: "",
  linkedin: "",
  github: "",
  website: "",
  twitter: "",
  portfolioUrl: "",
  stackoverflow: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  achievements: [],
  portfolio: [],
};

type TabId = "basics" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages" | "achievements" | "portfolio";

export function ProfessionalIdentityEditor({
  initialData,
  onSave,
  onSkip,
  showSkip = false,
  compact = false,
}: ProfessionalIdentityEditorProps) {
  const [profile, setProfile] = useState<ProfileData>({
    ...DEFAULT_PROFILE,
    ...initialData,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("basics");

  // Update local state when initialData changes (e.g., after fetch)
  useEffect(() => {
    if (initialData) {
      setProfile({ ...DEFAULT_PROFILE, ...initialData });
    }
  }, [initialData]);

  // Profile completeness
  const completeness = useMemo(() => calculateProfileCompleteness(profile), [profile]);

  const updateField = useCallback((field: keyof ProfileData, value: unknown) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  }, []);

  // ── Experience helpers ──

  const addExperience = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        { company: "", position: "", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] },
      ],
    }));
  }, []);

  const updateExperience = useCallback((index: number, field: string, value: unknown) => {
    setProfile((prev) => {
      const exp = [...(prev.experience || [])];
      exp[index] = { ...exp[index], [field]: value };
      return { ...prev, experience: exp };
    });
  }, []);

  const removeExperience = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      experience: (prev.experience || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Education helpers ──

  const addEducation = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { school: "", degree: "", field: "", year: "", gpa: "", minor: "", honors: "", activities: "", location: "" },
      ],
    }));
  }, []);

  const updateEducation = useCallback((index: number, field: string, value: string) => {
    setProfile((prev) => {
      const edu = [...(prev.education || [])];
      edu[index] = { ...edu[index], [field]: value };
      return { ...prev, education: edu };
    });
  }, []);

  const removeEducation = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Skills helpers ──

  const updateSkills = useCallback((skillsText: string) => {
    const skills: ProfileData["skills"] = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ name: s, level: "Intermediate", category: "", years: "" }));
    setProfile((prev) => ({ ...prev, skills }));
    setSaved(false);
    setError(null);
  }, []);

  // ── Projects helpers ──

  const addProject = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { name: "", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed", bulletPoints: [] },
      ],
    }));
  }, []);

  const updateProject = useCallback((index: number, field: string, value: unknown) => {
    setProfile((prev) => {
      const projects = [...(prev.projects || [])];
      projects[index] = { ...projects[index], [field]: value };
      return { ...prev, projects };
    });
  }, []);

  const removeProject = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Certifications helpers ──

  const addCertification = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        { name: "", issuer: "", date: "", link: "", description: "", expiryDate: "", skills: "" },
      ],
    }));
  }, []);

  const updateCertification = useCallback((index: number, field: string, value: string) => {
    setProfile((prev) => {
      const certs = [...(prev.certifications || [])];
      certs[index] = { ...certs[index], [field]: value };
      return { ...prev, certifications: certs };
    });
  }, []);

  const removeCertification = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Languages helpers ──

  const addLanguage = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      languages: [...(prev.languages || []), { name: "", proficiency: "Fluent" }],
    }));
  }, []);

  const updateLanguage = useCallback((index: number, field: string, value: string) => {
    setProfile((prev) => {
      const langs = [...(prev.languages || [])];
      langs[index] = { ...langs[index], [field]: value };
      return { ...prev, languages: langs };
    });
  }, []);

  const removeLanguage = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      languages: (prev.languages || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Achievements helpers ──

  const addAchievement = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), { title: "", description: "", date: "", issuer: "" }],
    }));
  }, []);

  const updateAchievement = useCallback((index: number, field: string, value: string) => {
    setProfile((prev) => {
      const achs = [...(prev.achievements || [])];
      achs[index] = { ...achs[index], [field]: value };
      return { ...prev, achievements: achs };
    });
  }, []);

  const removeAchievement = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Portfolio helpers ──

  const addPortfolio = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      portfolio: [...(prev.portfolio || []), { title: "", description: "", url: "", type: "other" }],
    }));
  }, []);

  const updatePortfolio = useCallback((index: number, field: string, value: string) => {
    setProfile((prev) => {
      const port = [...(prev.portfolio || [])];
      port[index] = { ...port[index], [field]: value };
      return { ...prev, portfolio: port };
    });
  }, []);

  const removePortfolio = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      portfolio: (prev.portfolio || []).filter((_, i) => i !== index),
    }));
  }, []);

  // ── Save handler ──

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: profile }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSaved(true);
      onSave?.(profile);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [profile, onSave]);

  // ── Tab config ──

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "basics", label: "Basics", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "skills", label: "Skills", icon: Wrench },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "certifications", label: "Certs", icon: Award },
    { id: "languages", label: "Languages", icon: Globe },
    { id: "achievements", label: "Awards", icon: Trophy },
    { id: "portfolio", label: "Portfolio", icon: Palette },
  ];

  // ── Styles ──

  const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50";
  const labelClass = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

  // ── Completeness bar ──

  const completenessColor =
    completeness.overall >= 80
      ? "bg-emerald-500"
      : completeness.overall >= 50
        ? "bg-amber-500"
        : "bg-rose-500";

  // ── Render ──

  return (
    <div className="space-y-4">
      {/* Completeness indicator */}
      {!compact && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
              Profile completeness
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {completeness.overall}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completenessColor}`}
              style={{ width: `${completeness.overall}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      {!compact && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-white/[0.08] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-cyan-600 dark:text-cyan-400 border-cyan-500"
                    : "text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Basics ── */}
      {(activeTab === "basics" || compact) && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={profile.fullName || ""}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Jane Smith"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Professional Headline</label>
              <input
                type="text"
                value={profile.headline || ""}
                onChange={(e) => updateField("headline", e.target.value)}
                placeholder="Senior Data Engineer"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Location</label>
              <input
                type="text"
                value={profile.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="San Francisco, CA"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nationality</label>
              <input
                type="text"
                value={profile.nationality || ""}
                onChange={(e) => updateField("nationality", e.target.value)}
                placeholder="American"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Pronouns</label>
              <input
                type="text"
                value={profile.pronouns || ""}
                onChange={(e) => updateField("pronouns", e.target.value)}
                placeholder="she/her"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>LinkedIn</label>
              <input
                type="url"
                value={profile.linkedin || ""}
                onChange={(e) => updateField("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/janesmith"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>GitHub</label>
              <input
                type="url"
                value={profile.github || ""}
                onChange={(e) => updateField("github", e.target.value)}
                placeholder="https://github.com/janesmith"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input
                type="url"
                value={profile.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://janesmith.com"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Twitter / X</label>
              <input
                type="url"
                value={profile.twitter || ""}
                onChange={(e) => updateField("twitter", e.target.value)}
                placeholder="https://x.com/janesmith"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Portfolio URL</label>
              <input
                type="url"
                value={profile.portfolioUrl || ""}
                onChange={(e) => updateField("portfolioUrl", e.target.value)}
                placeholder="https://janesmith.design"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stack Overflow</label>
              <input
                type="url"
                value={profile.stackoverflow || ""}
                onChange={(e) => updateField("stackoverflow", e.target.value)}
                placeholder="https://stackoverflow.com/users/..."
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Professional Summary</label>
            <textarea
              value={profile.summary || ""}
              onChange={(e) => updateField("summary", e.target.value)}
              placeholder="Experienced data engineer with 5+ years building scalable cloud data pipelines..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      )}

      {/* ── Experience ── */}
      {activeTab === "experience" && !compact && (
        <div className="space-y-3">
          {(profile.experience || []).map((exp, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Experience {i + 1}</span>
                <button onClick={() => removeExperience(i)} className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={exp.company || ""} onChange={(e) => updateExperience(i, "company", e.target.value)} placeholder="Company name" className={inputClass} />
                <input type="text" value={exp.position || ""} onChange={(e) => updateExperience(i, "position", e.target.value)} placeholder="Position" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={exp.location || ""} onChange={(e) => updateExperience(i, "location", e.target.value)} placeholder="Location" className={inputClass} />
                <input type="text" value={exp.employmentType || ""} onChange={(e) => updateExperience(i, "employmentType", e.target.value)} placeholder="Full-time" className={inputClass} />
                <input type="text" value={exp.industry || ""} onChange={(e) => updateExperience(i, "industry", e.target.value)} placeholder="Industry" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={exp.startDate || ""} onChange={(e) => updateExperience(i, "startDate", e.target.value)} placeholder="Start date" className={inputClass} />
                <input type="text" value={exp.endDate || ""} onChange={(e) => updateExperience(i, "endDate", e.target.value)} placeholder="End date" className={inputClass} />
                <input type="text" value={exp.duration || ""} onChange={(e) => updateExperience(i, "duration", e.target.value)} placeholder="Duration" className={inputClass} />
              </div>
              <textarea value={exp.description || ""} onChange={(e) => updateExperience(i, "description", e.target.value)} placeholder="Description of your role..." rows={2} className={`${inputClass} resize-none`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={exp.achievements || ""} onChange={(e) => updateExperience(i, "achievements", e.target.value)} placeholder="Key achievements" className={inputClass} />
                <input type="text" value={exp.techUsed || ""} onChange={(e) => updateExperience(i, "techUsed", e.target.value)} placeholder="Technologies used" className={inputClass} />
              </div>
            </div>
          ))}
          <button onClick={addExperience} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Experience
          </button>
        </div>
      )}

      {/* ── Education ── */}
      {activeTab === "education" && !compact && (
        <div className="space-y-3">
          {(profile.education || []).map((edu, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Education {i + 1}</span>
                <button onClick={() => removeEducation(i)} className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={edu.school || ""} onChange={(e) => updateEducation(i, "school", e.target.value)} placeholder="University name" className={inputClass} />
                <input type="text" value={edu.degree || ""} onChange={(e) => updateEducation(i, "degree", e.target.value)} placeholder="Degree" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={edu.field || ""} onChange={(e) => updateEducation(i, "field", e.target.value)} placeholder="Field of study" className={inputClass} />
                <input type="text" value={edu.year || ""} onChange={(e) => updateEducation(i, "year", e.target.value)} placeholder="Year" className={inputClass} />
                <input type="text" value={edu.gpa || ""} onChange={(e) => updateEducation(i, "gpa", e.target.value)} placeholder="GPA" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={edu.minor || ""} onChange={(e) => updateEducation(i, "minor", e.target.value)} placeholder="Minor" className={inputClass} />
                <input type="text" value={edu.honors || ""} onChange={(e) => updateEducation(i, "honors", e.target.value)} placeholder="Honors" className={inputClass} />
                <input type="text" value={edu.location || ""} onChange={(e) => updateEducation(i, "location", e.target.value)} placeholder="Location" className={inputClass} />
              </div>
              <input type="text" value={edu.activities || ""} onChange={(e) => updateEducation(i, "activities", e.target.value)} placeholder="Activities" className={inputClass} />
            </div>
          ))}
          <button onClick={addEducation} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Education
          </button>
        </div>
      )}

      {/* ── Skills ── */}
      {activeTab === "skills" && !compact && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Skills (comma-separated)</label>
            <textarea
              value={(profile.skills || [])
                .map((s) => (typeof s === "string" ? s : s.name || ""))
                .join(", ")}
              onChange={(e) => updateSkills(e.target.value)}
              placeholder="Python, SQL, Azure Data Factory, PySpark, Docker"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          {(profile.skills || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(profile.skills || []).map((s, i) => {
                const name = typeof s === "string" ? s : s.name || "";
                return name ? (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
                    {name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Projects ── */}
      {activeTab === "projects" && !compact && (
        <div className="space-y-3">
          {(profile.projects || []).map((proj, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Project {i + 1}</span>
                <button onClick={() => removeProject(i)} className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={proj.name || ""} onChange={(e) => updateProject(i, "name", e.target.value)} placeholder="Project name" className={inputClass} />
                <input type="text" value={proj.role || ""} onChange={(e) => updateProject(i, "role", e.target.value)} placeholder="Your role" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={proj.tech || ""} onChange={(e) => updateProject(i, "tech", e.target.value)} placeholder="Technologies" className={inputClass} />
                <input type="text" value={proj.link || ""} onChange={(e) => updateProject(i, "link", e.target.value)} placeholder="Link" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={proj.startDate || ""} onChange={(e) => updateProject(i, "startDate", e.target.value)} placeholder="Start date" className={inputClass} />
                <input type="text" value={proj.endDate || ""} onChange={(e) => updateProject(i, "endDate", e.target.value)} placeholder="End date" className={inputClass} />
                <input type="text" value={proj.teamSize || ""} onChange={(e) => updateProject(i, "teamSize", e.target.value)} placeholder="Team size" className={inputClass} />
              </div>
              <textarea value={proj.description || ""} onChange={(e) => updateProject(i, "description", e.target.value)} placeholder="Project description..." rows={2} className={`${inputClass} resize-none`} />
            </div>
          ))}
          <button onClick={addProject} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Project
          </button>
        </div>
      )}

      {/* ── Certifications ── */}
      {activeTab === "certifications" && !compact && (
        <div className="space-y-3">
          {(profile.certifications || []).map((cert, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Certification {i + 1}</span>
                <button onClick={() => removeCertification(i)} className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={cert.name || ""} onChange={(e) => updateCertification(i, "name", e.target.value)} placeholder="Certification name" className={inputClass} />
                <input type="text" value={cert.issuer || ""} onChange={(e) => updateCertification(i, "issuer", e.target.value)} placeholder="Issuing organization" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={cert.date || ""} onChange={(e) => updateCertification(i, "date", e.target.value)} placeholder="Date" className={inputClass} />
                <input type="text" value={cert.expiryDate || ""} onChange={(e) => updateCertification(i, "expiryDate", e.target.value)} placeholder="Expiry date" className={inputClass} />
                <input type="text" value={cert.link || ""} onChange={(e) => updateCertification(i, "link", e.target.value)} placeholder="Verification link" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={cert.skills || ""} onChange={(e) => updateCertification(i, "skills", e.target.value)} placeholder="Related skills" className={inputClass} />
                <input type="text" value={cert.description || ""} onChange={(e) => updateCertification(i, "description", e.target.value)} placeholder="Description" className={inputClass} />
              </div>
            </div>
          ))}
          <button onClick={addCertification} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Certification
          </button>
        </div>
      )}

      {/* ── Languages ── */}
      {activeTab === "languages" && !compact && (
        <div className="space-y-3">
          {(profile.languages || []).map((lang, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Language {i + 1}</span>
                <button onClick={() => removeLanguage(i)} className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={lang.name || ""} onChange={(e) => updateLanguage(i, "name", e.target.value)} placeholder="Language" className={inputClass} />
                <select value={lang.proficiency || "Fluent"} onChange={(e) => updateLanguage(i, "proficiency", e.target.value)} className={inputClass}>
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Professional">Professional</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Beginner">Beginner</option>
                </select>
              </div>
            </div>
          ))}
          <button onClick={addLanguage} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Language
          </button>
        </div>
      )}

      {/* ── Achievements ── */}
      {activeTab === "achievements" && !compact && (
        <div className="space-y-3">
          {(profile.achievements || []).map((ach, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Achievement {i + 1}</span>
                <button onClick={() => removeAchievement(i)} className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={ach.title || ""} onChange={(e) => updateAchievement(i, "title", e.target.value)} placeholder="Achievement title" className={inputClass} />
                <input type="text" value={ach.issuer || ""} onChange={(e) => updateAchievement(i, "issuer", e.target.value)} placeholder="Issuing organization" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={ach.date || ""} onChange={(e) => updateAchievement(i, "date", e.target.value)} placeholder="Date" className={inputClass} />
                <input type="text" value={ach.description || ""} onChange={(e) => updateAchievement(i, "description", e.target.value)} placeholder="Description" className={inputClass} />
              </div>
            </div>
          ))}
          <button onClick={addAchievement} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Achievement
          </button>
        </div>
      )}

      {/* ── Portfolio ── */}
      {activeTab === "portfolio" && !compact && (
        <div className="space-y-3">
          {(profile.portfolio || []).map((port, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Portfolio {i + 1}</span>
                <button onClick={() => removePortfolio(i)} className="text-xs text-red-500 hover:text-red-600">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={port.title || ""} onChange={(e) => updatePortfolio(i, "title", e.target.value)} placeholder="Title" className={inputClass} />
                <input type="text" value={port.url || ""} onChange={(e) => updatePortfolio(i, "url", e.target.value)} placeholder="URL" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select value={port.type || "other"} onChange={(e) => updatePortfolio(i, "type", e.target.value)} className={inputClass}>
                  <option value="github">GitHub</option>
                  <option value="website">Website</option>
                  <option value="dribbble">Dribbble</option>
                  <option value="figma">Figma</option>
                  <option value="other">Other</option>
                </select>
                <input type="text" value={port.description || ""} onChange={(e) => updatePortfolio(i, "description", e.target.value)} placeholder="Description" className={inputClass} />
              </div>
            </div>
          ))}
          <button onClick={addPortfolio} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Portfolio Item
          </button>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2">
        {showSkip && onSkip && (
          <button onClick={onSkip} className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white">
            Skip for now
          </button>
        )}
        <div className="flex-1" />
        {error && <span className="text-xs text-red-500">{error}</span>}
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-xs font-medium text-white transition-all"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>
    </div>
  );
}

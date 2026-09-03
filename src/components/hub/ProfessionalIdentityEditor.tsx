"use client";

import { useState, useCallback, useEffect } from "react";
import { User, Briefcase, GraduationCap, Wrench, Save, Loader2, CheckCircle2 } from "lucide-react";

interface ProfileData {
  fullName?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  experience?: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
    year: string;
  }>;
  skills?: string[];
}

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
  linkedin: "",
  github: "",
  website: "",
  experience: [],
  education: [],
  skills: [],
};

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
  const [activeTab, setActiveTab] = useState<"basics" | "experience" | "education" | "skills">("basics");

  // Update local state when initialData changes (e.g., after fetch)
  useEffect(() => {
    if (initialData) {
      setProfile({ ...DEFAULT_PROFILE, ...initialData });
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof ProfileData, value: unknown) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  }, []);

  const addExperience = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        { company: "", position: "", duration: "", description: "" },
      ],
    }));
  }, []);

  const updateExperience = useCallback((index: number, field: string, value: string) => {
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

  const addEducation = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { school: "", degree: "", field: "", year: "" },
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

  const updateSkills = useCallback((skillsText: string) => {
    const skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
    setProfile((prev) => ({ ...prev, skills }));
    setSaved(false);
    setError(null);
  }, []);

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

  const tabs = [
    { id: "basics" as const, label: "Basics", icon: User },
    { id: "experience" as const, label: "Experience", icon: Briefcase },
    { id: "education" as const, label: "Education", icon: GraduationCap },
    { id: "skills" as const, label: "Skills", icon: Wrench },
  ];

  const inputClass = "w-full rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50";
  const labelClass = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

  return (
    <div className="space-y-4">
      {/* Tabs */}
      {!compact && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-white/[0.08]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "text-cyan-600 dark:text-cyan-400 border-cyan-500"
                  : "text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Basics */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Experience */}
      {activeTab === "experience" && !compact && (
        <div className="space-y-3">
          {(profile.experience || []).map((exp, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Experience {i + 1}</span>
                <button onClick={() => removeExperience(i)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(i, "company", e.target.value)}
                  placeholder="Company name"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateExperience(i, "position", e.target.value)}
                  placeholder="Position"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={exp.duration}
                  onChange={(e) => updateExperience(i, "duration", e.target.value)}
                  placeholder="Jan 2021 - Present"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={exp.description}
                  onChange={(e) => updateExperience(i, "description", e.target.value)}
                  placeholder="Brief description"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          <button onClick={addExperience} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Experience
          </button>
        </div>
      )}

      {/* Education */}
      {activeTab === "education" && !compact && (
        <div className="space-y-3">
          {(profile.education || []).map((edu, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Education {i + 1}</span>
                <button onClick={() => removeEducation(i)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => updateEducation(i, "school", e.target.value)}
                  placeholder="University name"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(i, "degree", e.target.value)}
                  placeholder="Degree"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => updateEducation(i, "field", e.target.value)}
                  placeholder="Field of study"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) => updateEducation(i, "year", e.target.value)}
                  placeholder="2020"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          <button onClick={addEducation} className="w-full rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            + Add Education
          </button>
        </div>
      )}

      {/* Skills */}
      {activeTab === "skills" && !compact && (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Skills (comma-separated)</label>
            <textarea
              value={(profile.skills || []).join(", ")}
              onChange={(e) => updateSkills(e.target.value)}
              placeholder="Python, SQL, Azure Data Factory, PySpark, Docker"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          {(profile.skills || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills!.map((skill) => (
                <span key={skill} className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
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

export type { ProfileData };

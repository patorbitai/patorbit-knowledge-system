"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Resume,
  SectionId,
  ResumeAnalysis,
  JobMatchResult,
  AIActionState,
} from "@/types/resume";

/* ── Defaults ── */

const defaultSocial = {
  linkedin: "",
  github: "",
  website: "",
  twitter: "",
  portfolio: "",
  stackoverflow: "",
};

export const defaultResume: Resume = {
  name: "",
  title: "",
  email: "",
  phone: "",
  address: "",
  nationality: "",
  pronouns: "",
  summary: "",
  social: defaultSocial,
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  achievements: [],
  references: [],
  portfolio: [],
  templateId: "modern-clean",
};

/* ── ID generator ── */
let _idCounter = Date.now();
function uid(): string {
  return `id_${++_idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Helpers ── */

function calcSectionComplete(section: SectionId, resume: Resume): boolean {
  switch (section) {
    case "personal":
      return !!(resume.name && resume.email && resume.phone);
    case "experience":
      return resume.experience.length > 0 && resume.experience.some((e) => e.company && e.position);
    case "education":
      return resume.education.length > 0 && resume.education.some((e) => e.school && e.degree);
    case "skills":
      return resume.skills.length > 0 && resume.skills.some((s) => s.name);
    case "projects":
      return resume.projects.length > 0 && resume.projects.some((p) => p.name);
    case "certifications":
      return resume.certifications.length > 0 && resume.certifications.some((c) => c.name);
    case "achievements":
      return resume.achievements.length > 0;
    case "languages":
      return resume.languages.length > 0;
    case "portfolio":
      return resume.portfolio.length > 0;
    case "review":
      return true;
  }
}

function calcResumeScore(resume: Resume): number {
  let score = 0;
  if (resume.name) score += 5;
  if (resume.email) score += 3;
  if (resume.phone) score += 2;
  if (resume.summary) score += 8;
  if (resume.social.linkedin) score += 3;
  if (resume.social.github) score += 3;
  if (resume.social.website) score += 2;
  score += Math.min(resume.experience.length * 12, 36);
  score += Math.min(resume.education.length * 6, 12);
  score += Math.min(resume.skills.length * 4, 12);
  score += Math.min(resume.projects.length * 5, 10);
  score += Math.min(resume.certifications.length * 2, 4);
  return Math.min(score, 100);
}

/* ── Store types ── */

export type SaveStatus = "saved" | "saving" | "unsaved" | "cloud-synced";

export interface ResumeBuilderState {
  /* Data */
  resume: Resume;
  activeSection: SectionId;
  saveStatus: SaveStatus;

  /* AI */
  analysis: ResumeAnalysis | null;
  analysisLoading: boolean;
  jobMatch: JobMatchResult | null;
  jobDescription: string;
  aiActions: Record<string, AIActionState>;

  /* UI */
  isCopilotOpen: boolean;
  isJobMatchOpen: boolean;
  previewTab: "resume" | "passport" | "knowledge-graph" | "trust-timeline";

  /* Actions – data */
  setResume: (resume: Resume) => void;
  updateField: <K extends keyof Resume>(key: K, value: Resume[K]) => void;
  updateSocial: (key: keyof typeof defaultSocial, value: string) => void;
  setActiveSection: (id: SectionId) => void;
  resetResume: () => void;

  /* Actions – array helpers */
  addExperience: () => void;
  updateExperience: (id: string, field: string, value: unknown) => void;
  removeExperience: (id: string) => void;
  moveExperience: (id: string, dir: -1 | 1) => void;

  addEducation: () => void;
  updateEducation: (id: string, field: string, value: unknown) => void;
  removeEducation: (id: string) => void;
  moveEducation: (id: string, dir: -1 | 1) => void;

  addSkill: () => void;
  updateSkill: (id: string, field: string, value: unknown) => void;
  removeSkill: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, field: string, value: unknown) => void;
  removeProject: (id: string) => void;
  moveProject: (id: string, dir: -1 | 1) => void;

  addCertification: () => void;
  updateCertification: (id: string, field: string, value: unknown) => void;
  removeCertification: (id: string) => void;
  moveCertification: (id: string, dir: -1 | 1) => void;

  addAchievement: () => void;
  updateAchievement: (id: string, field: string, value: unknown) => void;
  removeAchievement: (id: string) => void;

  addLanguage: () => void;
  updateLanguage: (id: string, field: string, value: unknown) => void;
  removeLanguage: (id: string) => void;

  addPortfolio: () => void;
  updatePortfolio: (id: string, field: string, value: unknown) => void;
  removePortfolio: (id: string) => void;

  /* Actions – AI */
  setAnalysis: (analysis: ResumeAnalysis | null) => void;
  setAnalysisLoading: (loading: boolean) => void;
  setJobMatch: (match: JobMatchResult | null) => void;
  setJobDescription: (desc: string) => void;
  setAIAction: (key: string, state: Partial<AIActionState>) => void;
  setCopilotOpen: (open: boolean) => void;
  setJobMatchOpen: (open: boolean) => void;
  setPreviewTab: (tab: "resume" | "passport" | "knowledge-graph" | "trust-timeline") => void;
  setSaveStatus: (status: SaveStatus) => void;

  /* Computed */
  progress: () => number;
  resumeScore: () => number;
  sectionComplete: (section: SectionId) => boolean;
  getSaveStatus: () => SaveStatus;
}

/* ── Store ── */

export const useResumeBuilder = create<ResumeBuilderState>()(
  persist(
    (set, get) => {
      /* Reusable array helpers factory */
      function makeArrayHelpers<K extends keyof Resume>(
        key: K,
        defaultItem: Partial<Resume[K] extends (infer U)[] ? U : never>,
      ) {
        return {
          add: () =>
            set((s) => {
              const arr = (s.resume[key] ?? []) as unknown as Record<string, unknown>[];
              const item = { ...(defaultItem as Record<string, unknown>), id: uid() } as Resume[K] extends (infer U)[] ? U : never;
              return { resume: { ...s.resume, [key]: [...arr, item] } };
            }),
          update: (id: string, field: string, value: unknown) =>
            set((s) => ({
              resume: {
                ...s.resume,
                [key]: ((s.resume[key] ?? []) as unknown as Record<string, unknown>[]).map((item) =>
                  item.id === id ? { ...item, [field]: value } : item,
                ),
              },
            })),
          remove: (id: string) =>
            set((s) => ({
              resume: {
                ...s.resume,
                [key]: ((s.resume[key] ?? []) as unknown as Record<string, unknown>[]).filter(
                  (item) => item.id !== id,
                ),
              },
            })),
          move: (id: string, dir: -1 | 1) =>
            set((s) => {
              const arr = [...((s.resume[key] ?? []) as unknown as Record<string, unknown>[])];
              const idx = arr.findIndex((item) => item.id === id);
              if (idx < 0) return s;
              const to = idx + dir;
              if (to < 0 || to >= arr.length) return s;
              const [moved] = arr.splice(idx, 1);
              arr.splice(to, 0, moved);
              return { resume: { ...s.resume, [key]: arr } };
            }),
        };
      }

      /* Default items */
      const defaultExp = { company: "", position: "", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] };
      const defaultEdu = { school: "", degree: "", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" };
      const defaultSkill = { name: "", level: "Intermediate" as const, category: "", years: "" };
      const defaultProj = { name: "", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] };
      const defaultCert = { name: "", issuer: "", date: "", link: "", description: "", expiryDate: "", skills: "" };
      const defaultAch = { title: "", description: "", date: "", issuer: "" };
      const defaultLang = { name: "", proficiency: "Fluent" as const };
      const defaultPortfolio = { title: "", description: "", url: "", type: "other" as const };

      const expH = makeArrayHelpers("experience", defaultExp);
      const eduH = makeArrayHelpers("education", defaultEdu);
      const skillH = makeArrayHelpers("skills", defaultSkill);
      const projH = makeArrayHelpers("projects", defaultProj);
      const certH = makeArrayHelpers("certifications", defaultCert);
      const achH = makeArrayHelpers("achievements", defaultAch);
      const langH = makeArrayHelpers("languages", defaultLang);
      const portH = makeArrayHelpers("portfolio", defaultPortfolio);

      return {
        resume: defaultResume,
        activeSection: "personal",
        saveStatus: "unsaved",

        analysis: null,
        analysisLoading: false,
        jobMatch: null,
        jobDescription: "",
        aiActions: {},

        isCopilotOpen: true,
        isJobMatchOpen: false,
        previewTab: "resume",

        /* ── Data setters ── */
        setResume: (resume) => set({ resume, saveStatus: "unsaved" }),
        updateField: (key, value) =>
          set((s) => ({ resume: { ...s.resume, [key]: value }, saveStatus: "unsaved" })),
        updateSocial: (key, value) =>
          set((s) => ({
            resume: { ...s.resume, social: { ...s.resume.social, [key]: value } },
            saveStatus: "unsaved",
          })),
        setActiveSection: (id) => set({ activeSection: id }),
        resetResume: () => set({ resume: defaultResume, analysis: null, jobMatch: null, saveStatus: "unsaved" }),
        setSaveStatus: (status) => set({ saveStatus: status }),

        /* ── AI setters ── */
        setAnalysis: (analysis) => set({ analysis }),
        setAnalysisLoading: (loading) => set({ analysisLoading: loading }),
        setJobMatch: (match) => set({ jobMatch: match }),
        setJobDescription: (desc) => set({ jobDescription: desc }),
        setAIAction: (key, state) =>
          set((s) => ({
            aiActions: {
              ...s.aiActions,
              [key]: { ...(s.aiActions[key] ?? { status: "idle", result: null, error: null }), ...state },
            },
          })),
        setCopilotOpen: (open) => set({ isCopilotOpen: open }),
        setJobMatchOpen: (open) => set({ isJobMatchOpen: open }),
        setPreviewTab: (tab) => set({ previewTab: tab }),

        /* ── Array helpers ── */
        addExperience: expH.add,
        updateExperience: expH.update,
        removeExperience: expH.remove,
        moveExperience: expH.move,

        addEducation: eduH.add,
        updateEducation: eduH.update,
        removeEducation: eduH.remove,
        moveEducation: eduH.move,

        addSkill: skillH.add,
        updateSkill: skillH.update,
        removeSkill: skillH.remove,

        addProject: projH.add,
        updateProject: projH.update,
        removeProject: projH.remove,
        moveProject: projH.move,

        addCertification: certH.add,
        updateCertification: certH.update,
        removeCertification: certH.remove,
        moveCertification: certH.move,

        addAchievement: achH.add,
        updateAchievement: achH.update,
        removeAchievement: achH.remove,

        addLanguage: langH.add,
        updateLanguage: langH.update,
        removeLanguage: langH.remove,

        addPortfolio: portH.add,
        updatePortfolio: portH.update,
        removePortfolio: portH.remove,

        /* ── Computed ── */
        progress: () => {
          const s = get();
          const sections: SectionId[] = [
            "personal", "experience", "education", "skills", "projects",
            "certifications", "achievements", "languages", "portfolio",
          ];
          const complete = sections.filter((sec) => calcSectionComplete(sec, s.resume));
          return Math.round((complete.length / sections.length) * 100);
        },
        resumeScore: () => calcResumeScore(get().resume),
        sectionComplete: (section) => calcSectionComplete(section, get().resume),
        getSaveStatus: () => get().saveStatus,
      };
    },
    {
      name: "patorbit-resume-v2",
      partialize: (state) => ({ resume: state.resume }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setSaveStatus("saved");
      },
    },
  ),
);

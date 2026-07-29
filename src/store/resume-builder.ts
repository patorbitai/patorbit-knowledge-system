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
import { hasSufficientData, analyzeResume } from "@/lib/ai/resume-ai";
import { TEMPLATES } from "@/app/resume-builder/templates";

/* ── Defaults ── */

const defaultSocial = { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" };

export const defaultResume: Resume = {
  name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "",
  social: defaultSocial, experience: [], education: [], skills: [], projects: [], certifications: [],
  languages: [], interests: [], achievements: [], references: [], portfolio: [], templateId: "modern-clean",
  careerStage: "working-professional", fontPreference: "inter", palettePreference: "slate",
};

let _idCounter = Date.now();
function uid(): string { return `id_${++_idCounter}_${Math.random().toString(36).slice(2, 7)}`; }

/* ── Store types ── */

export type SaveStatus = "saved" | "saving" | "unsaved" | "cloud-synced" | "offline" | "sync-failed";

export interface ResumeBuilderState {
  resume: Resume; activeSection: SectionId; saveStatus: SaveStatus;
  analysis: ResumeAnalysis | null; analysisLoading: boolean;
  jobMatch: JobMatchResult | null; jobDescription: string;
  aiActions: Record<string, AIActionState>;
  isCopilotOpen: boolean; isJobMatchOpen: boolean;
  previewTab: "resume" | "passport" | "knowledge-graph" | "trust-timeline";
  setResume: (resume: Resume) => void;
  updateField: <K extends keyof Resume>(key: K, value: Resume[K]) => void;
  updateSocial: (key: keyof typeof defaultSocial, value: string) => void;
  setActiveSection: (id: SectionId) => void;
  setCareerStage: (stage: import("@/types/resume").CareerStage) => void;
  resetResume: () => void;
  applyTemplate: (templateId: string) => void;
  startAnalysis: () => Promise<void>;
  addExperience: () => void; updateExperience: (id: string, field: string, value: unknown) => void; removeExperience: (id: string) => void; moveExperience: (id: string, dir: -1 | 1) => void;
  addEducation: () => void; updateEducation: (id: string, field: string, value: unknown) => void; removeEducation: (id: string) => void; moveEducation: (id: string, dir: -1 | 1) => void;
  addSkill: () => void; updateSkill: (id: string, field: string, value: unknown) => void; removeSkill: (id: string) => void;
  addProject: () => void; updateProject: (id: string, field: string, value: unknown) => void; removeProject: (id: string) => void; moveProject: (id: string, dir: -1 | 1) => void;
  addCertification: () => void; updateCertification: (id: string, field: string, value: unknown) => void; removeCertification: (id: string) => void; moveCertification: (id: string, dir: -1 | 1) => void;
  addAchievement: () => void; updateAchievement: (id: string, field: string, value: unknown) => void; removeAchievement: (id: string) => void;
  addLanguage: () => void; updateLanguage: (id: string, field: string, value: unknown) => void; removeLanguage: (id: string) => void;
  addPortfolio: () => void; updatePortfolio: (id: string, field: string, value: unknown) => void; removePortfolio: (id: string) => void;
  setAnalysis: (analysis: ResumeAnalysis | null) => void; setAnalysisLoading: (loading: boolean) => void;
  setJobMatch: (match: JobMatchResult | null) => void; setJobDescription: (desc: string) => void;
  setAIAction: (key: string, state: Partial<AIActionState>) => void; setCopilotOpen: (open: boolean) => void;
  setJobMatchOpen: (open: boolean) => void; setPreviewTab: (tab: "resume" | "passport" | "knowledge-graph" | "trust-timeline") => void;
  setSaveStatus: (status: SaveStatus) => void;
  progress: () => number; resumeScore: () => number | null; sectionComplete: (section: SectionId) => boolean; getSaveStatus: () => SaveStatus;
}

/* ── Store ── */

export const useResumeBuilder = create<ResumeBuilderState>()(
  persist(
    (set, get) => {
      function makeArrayHelpers<K extends keyof Resume>(key: K, defaultItem: Partial<Resume[K] extends (infer U)[] ? U : never>) {
        return {
          add: () => set((s) => {
            const arr = (s.resume[key] ?? []) as unknown as Record<string, unknown>[];
            const item = { ...(defaultItem as Record<string, unknown>), id: uid() } as Resume[K] extends (infer U)[] ? U : never;
            return { resume: { ...s.resume, [key]: [...arr, item] } };
          }),
          update: (id: string, field: string, value: unknown) => set((s) => ({ resume: { ...s.resume, [key]: ((s.resume[key] ?? []) as unknown as Record<string, unknown>[]).map((item) => item.id === id ? { ...item, [field]: value } : item) } })),
          remove: (id: string) => set((s) => ({ resume: { ...s.resume, [key]: ((s.resume[key] ?? []) as unknown as Record<string, unknown>[]).filter((item) => item.id !== id) } })),
          move: (id: string, dir: -1 | 1) => set((s) => {
            const arr = [...((s.resume[key] ?? []) as unknown as Record<string, unknown>[])];
            const idx = arr.findIndex((item) => item.id === id); if (idx < 0) return s;
            const to = idx + dir; if (to < 0 || to >= arr.length) return s;
            const [moved] = arr.splice(idx, 1); arr.splice(to, 0, moved);
            return { resume: { ...s.resume, [key]: arr } };
          }),
        };
      }

      const defaultExp = { company: "", position: "", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] };
      const defaultEdu = { school: "", degree: "", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" };
      const defaultSkill = { name: "", level: "Intermediate" as const, category: "", years: "" };
      const defaultProj = { name: "", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] };
      const defaultCert = { name: "", issuer: "", date: "", link: "", description: "", expiryDate: "", skills: "" };
      const defaultAch = { title: "", description: "", date: "", issuer: "" };
      const defaultLang = { name: "", proficiency: "Fluent" as const };
      const defaultPortfolio = { title: "", description: "", url: "", type: "other" as const };

      const expH = makeArrayHelpers("experience", defaultExp); const eduH = makeArrayHelpers("education", defaultEdu); const skillH = makeArrayHelpers("skills", defaultSkill); const projH = makeArrayHelpers("projects", defaultProj); const certH = makeArrayHelpers("certifications", defaultCert); const achH = makeArrayHelpers("achievements", defaultAch); const langH = makeArrayHelpers("languages", defaultLang); const portH = makeArrayHelpers("portfolio", defaultPortfolio);

      return {
        resume: defaultResume, analysis: null, activeSection: "personal", saveStatus: "unsaved",
        analysisLoading: false, jobMatch: null, jobDescription: "", aiActions: {},
        isCopilotOpen: true, isJobMatchOpen: false, previewTab: "resume",
        setResume: (resume) => set({ resume, saveStatus: "unsaved" }),
        updateField: (key, value) => set((s) => ({ resume: { ...s.resume, [key]: value }, saveStatus: "unsaved" })),
        updateSocial: (key, value) => set((s) => ({ resume: { ...s.resume, social: { ...s.resume.social, [key]: value } }, saveStatus: "unsaved" })),
        setActiveSection: (id) => set({ activeSection: id }),
        setCareerStage: (stage) => set((s) => ({ resume: { ...s.resume, careerStage: stage }, saveStatus: "unsaved" })),
        resetResume: () => set({ resume: defaultResume, analysis: null, jobMatch: null, saveStatus: "unsaved" }),
        setSaveStatus: (status) => set({ saveStatus: status }),
        setAnalysis: (analysis) => set({ analysis }), setAnalysisLoading: (loading) => set({ analysisLoading: loading }),
        setJobMatch: (match) => set({ jobMatch: match }), setJobDescription: (desc) => set({ jobDescription: desc }),
        setAIAction: (key, state) => set((s) => ({ aiActions: { ...s.aiActions, [key]: { ...(s.aiActions[key] ?? { status: "idle", result: null, error: null }), ...state } } })),
        setCopilotOpen: (open) => set({ isCopilotOpen: open }), setJobMatchOpen: (open) => set({ isJobMatchOpen: open }), setPreviewTab: (tab) => set({ previewTab: tab }),
        applyTemplate: (templateId) => {
          const template = TEMPLATES.find((t) => t.id === templateId);
          if (template) {
            set((s) => ({
              resume: {
                ...s.resume,
                templateId: template.id,
                fontPreference: template.suggestedFont,
              },
              saveStatus: "unsaved",
            }));
          }
        },
        addExperience: expH.add, updateExperience: expH.update, removeExperience: expH.remove, moveExperience: expH.move,
        addEducation: eduH.add, updateEducation: eduH.update, removeEducation: eduH.remove, moveEducation: eduH.move,
        addSkill: skillH.add, updateSkill: skillH.update, removeSkill: skillH.remove,
        addProject: projH.add, updateProject: projH.update, removeProject: projH.remove, moveProject: projH.move,
        addCertification: certH.add, updateCertification: certH.update, removeCertification: certH.remove, moveCertification: certH.move,
        addAchievement: achH.add, updateAchievement: achH.update, removeAchievement: achH.remove,
        addLanguage: langH.add, updateLanguage: langH.update, removeLanguage: langH.remove,
        addPortfolio: portH.add, updatePortfolio: portH.update, removePortfolio: portH.remove,
        startAnalysis: async () => {
          const { resume } = get();
          if (!hasSufficientData(resume) || get().analysisLoading) return;
          set({ analysisLoading: true, analysis: null });
          try {
            const result = await analyzeResume(resume);
            set({ analysis: result, analysisLoading: false });
          } catch (err: any) {
            set({ analysis: { status: "error", dataSufficiencyNote: err.message, phases: [], resumeScore: { overall: null, grammar: null, readability: null, keywordMatch: null, structure: null }, trustScore: { careerStage: resume.careerStage || "working-professional", components: [], overall: null, improvementSuggestions: [] }, atsScore: null, professionalImpact: null, missingSections: [], weakBulletPoints: [], weakActionVerbs: [], missingMetrics: [], missingCertifications: [], missingSocialLinks: [], suggestions: [] }, analysisLoading: false });
          }
        },
        progress: () => {
          const { resume } = get(); const sections: SectionId[] = ["personal", "experience", "education", "skills", "projects", "certifications", "achievements", "languages", "portfolio"];
          const complete = sections.filter((sec) => useResumeBuilder.getState().sectionComplete(sec));
          return Math.round((complete.length / sections.length) * 100);
        },
        resumeScore: () => get().analysis?.resumeScore?.overall ?? null,
        sectionComplete: (section) => {
          const { resume } = get();
          switch (section) {
            case "personal": return !!(resume.name && resume.email && resume.phone);
            case "experience": return resume.experience.length > 0 && resume.experience.some((e) => e.company && e.position);
            case "education": return resume.education.length > 0 && resume.education.some((e) => e.school && e.degree);
            case "skills": return resume.skills.length > 0 && resume.skills.some((s) => s.name); case "projects": return resume.projects.length > 0 && resume.projects.some((p) => p.name);
            case "certifications": return resume.certifications.length > 0 && resume.certifications.some((c) => c.name); case "achievements": return resume.achievements.length > 0;
            case "languages": return resume.languages.length > 0; case "portfolio": return resume.portfolio.length > 0;
            case "review": return true;
          }
        },
        getSaveStatus: () => get().saveStatus,
      };
    },
    {
      name: "patorbit-resume-v2",
      partialize: (state) => ({ resume: state.resume }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setSaveStatus("saved");
          if (hasSufficientData(state.resume)) {
            state.startAnalysis();
          }
        }
      },
    },
  ),
);

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StateCreator } from "zustand";
import type {
  Resume,
  SectionId,
  ResumeAnalysis,
  JobMatchResult,
  AIActionState,
  Claim,
  SuggestedClaim,
  Evidence,
  EvidenceStatus,
  EvidenceVisibility,
} from "@/types/resume";
import type { TrustSnapshot, TrustReport } from "@/types/knowledge-graph";
import type { CareerProfile } from "@/types/career-profile";
import type { JobProfile } from "@/types/job-profile";
import type { QualificationMatch } from "@/types/qualification-match";
import { buildCareerProfile } from "@/lib/career-profile";
import { buildJobProfile } from "@/lib/job-profile";
import { buildQualificationMatch } from "@/lib/qualification-match";
import { hasSufficientData } from "@/types/resume";
import { ai } from "@/lib/ai/client";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { DEFAULT_STYLE_CONFIG, resolveStyleConfig, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";

/* ── Defaults ── */

const defaultSocial = { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" };

let _idCounter = Date.now();
function uid(): string { return `id_${++_idCounter}_${Math.random().toString(36).slice(2, 7)}`; }

export const defaultResume: Resume = {
  resumeId: "default_resume",
  resumeName: "My Resume",
  name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "",
  social: defaultSocial, experience: [], education: [], skills: [], projects: [], certifications: [],
  languages: [], interests: [], achievements: [], references: [], portfolio: [], templateId: "modern-clean",
  careerStage: "working-professional", fontPreference: "inter", palettePreference: "slate",
  exportFormat: "pdf", pageSize: "letter",
  claims: [],
};

/* ── Store types ── */

export type SaveStatus = "saved" | "saving" | "unsaved" | "offline" | "sync-failed";

export interface ResumeBuilderState {
  resume: Resume;
  resumes: Resume[];
  activeResumeId: string;
  createResume: (name?: string) => string;
  switchResume: (resumeId: string) => void;
  renameResume: (resumeId: string, name: string) => void;
  deleteResume: (resumeId: string) => void;

  activeSection: SectionId;  saveStatus: SaveStatus;
  /** True after Zustand persist has rehydrated from localStorage. */
  hydrated: boolean;
  /** Server version per resume — populated by sync, used by write-back. */
  serverVersions: Record<string, number>;
  /** Conflict state: set when a write-back gets 409 CONFLICT. */
  writeConflict: { resumeId: string; serverVersion: number } | null;
  clearWriteConflict: () => void;
  analysis: ResumeAnalysis | null; analysisLoading: boolean;
  jobMatch: JobMatchResult | null; jobDescription: string;
  aiActions: Record<string, AIActionState>;
  isCopilotOpen: boolean; isJobMatchOpen: boolean;
  previewTab: "resume" | "passport" | "knowledge-graph" | "trust-timeline";
  suggestedClaims: SuggestedClaim[];
  evidence: Evidence[];
  trustScore: TrustSnapshot | null;
  setTrustScore: (score: TrustSnapshot | null) => void;
  trustReport: TrustReport | null;
  setTrustReport: (report: TrustReport | null) => void;
  careerProfile: CareerProfile | null;
  setCareerProfile: (profile: CareerProfile | null) => void;
  rebuildCareerProfile: () => CareerProfile | null;
  jobProfile: JobProfile | null;
  setJobProfile: (profile: JobProfile | null) => void;
  rebuildJobProfile: () => JobProfile | null;
  qualificationMatch: QualificationMatch | null;
  setQualificationMatch: (match: QualificationMatch | null) => void;
  rebuildQualificationMatch: () => QualificationMatch | null;
  addEvidence: (evidence: Evidence) => void;
  updateEvidence: (id: string, updates: Partial<Evidence>) => void;
  removeEvidence: (id: string) => void;
  setEvidenceStatus: (id: string, status: EvidenceStatus) => void;
  setEvidenceConsent: (id: string, consent: boolean) => void;
  setEvidenceVisibility: (id: string, visibility: EvidenceVisibility) => void;
  markClaimReadyForReview: (claimId: string) => void;
  evidenceForClaim: (claimId: string) => Evidence[];
  setResume: (resume: Resume) => void;
  updateField: <K extends keyof Resume>(key: K, value: Resume[K]) => void;
  updateSocial: (key: keyof typeof defaultSocial, value: string) => void;
  setActiveSection: (id: SectionId) => void;
  setCareerStage: (stage: import("@/types/resume").CareerStage) => void;
  resetResume: () => void;
  applyTemplate: (templateId: string) => void;
  setSuggestedClaims: (claims: SuggestedClaim[]) => void;
  acceptClaim: (suggestion: SuggestedClaim) => void;
  acceptEditedClaim: (suggestion: SuggestedClaim, editedText: string) => void;
  rejectClaim: (index: number) => void;
  persistClaim: (claim: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
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
  setJobMatchOpen: (open: boolean) => void;  setPreviewTab: (tab: "resume" | "passport" | "knowledge-graph" | "trust-timeline") => void;
  setSaveStatus: (status: SaveStatus) => void;
  setServerVersion: (resumeId: string, version: number) => void;
  triggerWriteBack: () => void;
  /** Visual customization per resume, stored separately from resume content. */
  styleConfigs: Record<string, ResumeStyleConfig>;
  setStyleConfig: (resumeId: string, patch: Partial<ResumeStyleConfig>) => void;
  resetStyleConfig: (resumeId: string) => void;
  progress: () => number; resumeScore: () => number | null; sectionComplete: (section: SectionId) => boolean; getSaveStatus: () => SaveStatus;
}

/* ── Store ── */

export const resumeStore: StateCreator<ResumeBuilderState> = (set, get) => {
      function makeArrayHelpers<K extends keyof Resume>(key: K, defaultItem: Partial<Resume[K] extends (infer U)[] ? U : never>) {
        return {
          add: () => set((s) => {
            const current = s.resume;
            const arr = (current[key] ?? []) as unknown as Record<string, unknown>[];
            const item = { ...(defaultItem as Record<string, unknown>), id: uid() } as Resume[K] extends (infer U)[] ? U : never;
            const updatedResume = { ...current, [key]: [...arr, item] };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resumes, resume: updatedResume, saveStatus: "unsaved" };
          }),
          update: (id: string, field: string, value: unknown) => set((s) => {
            const current = s.resume;
            const updatedResume = {
              ...current,
              [key]: ((current[key] ?? []) as unknown as Record<string, unknown>[]).map((item) => item.id === id ? { ...item, [field]: value } : item)
            };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resumes, resume: updatedResume, saveStatus: "unsaved" };
          }),
          remove: (id: string) => set((s) => {
            const current = s.resume;
            const updatedResume = {
              ...current,
              [key]: ((current[key] ?? []) as unknown as Record<string, unknown>[]).filter((item) => item.id !== id)
            };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resumes, resume: updatedResume, saveStatus: "unsaved" };
          }),
          move: (id: string, dir: -1 | 1) => set((s) => {
            const current = s.resume;
            const arr = [...((current[key] ?? []) as unknown as Record<string, unknown>[])];
            const idx = arr.findIndex((item) => item.id === id); if (idx < 0) return s;
            const to = idx + dir; if (to < 0 || to >= arr.length) return s;
            const [moved] = arr.splice(idx, 1); arr.splice(to, 0, moved);
            const updatedResume = { ...current, [key]: arr };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resumes, resume: updatedResume, saveStatus: "unsaved" };
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

      const initialId = uid();
      const initialResume: Resume = { ...defaultResume, resumeId: initialId, resumeName: "My Resume" };

      return {
        resume: initialResume,
        resumes: [initialResume],
        activeResumeId: initialId,

        createResume: (name?: string) => {
          const id = uid();
          const newName = name || `Resume ${get().resumes.length + 1}`;
          const newResume: Resume = {
            ...defaultResume,
            resumeId: id,
            resumeName: newName,
          };
          set((s) => {
            const resumes = [...s.resumes, newResume];
            return { resumes, activeResumeId: id, resume: newResume, saveStatus: "unsaved" };
          });
          return id;
        },
        switchResume: (resumeId: string) => {
          set((s) => {
            const found = s.resumes.find((r) => r.resumeId === resumeId);
            if (!found) return s;
            return { activeResumeId: resumeId, resume: found };
          });
        },
        renameResume: (resumeId: string, name: string) => {
          set((s) => {
            const resumes = s.resumes.map((r) => r.resumeId === resumeId ? { ...r, resumeName: name } : r);
            const resume = resumes.find((r) => r.resumeId === s.activeResumeId) || resumes[0];
            return { resumes, resume, saveStatus: "unsaved" };
          });
        },
        deleteResume: (resumeId: string) => {
          set((s) => {
            if (s.resumes.length <= 1) return s;
            const resumes = s.resumes.filter((r) => r.resumeId !== resumeId);
            const activeResumeId = s.activeResumeId === resumeId ? resumes[0].resumeId : s.activeResumeId;
            const resume = resumes.find((r) => r.resumeId === activeResumeId) || resumes[0];
            return { resumes, activeResumeId, resume, saveStatus: "unsaved" };
          });
        },

        analysis: null, activeSection: "personal", saveStatus: "unsaved",
        hydrated: false,
        serverVersions: {}, writeConflict: null,
        analysisLoading: false, jobMatch: null, jobDescription: "", jobProfile: null, aiActions: {},
        qualificationMatch: null,
        isCopilotOpen: true, isJobMatchOpen: false, previewTab: "resume",
        styleConfigs: {},
        setStyleConfig: (resumeId, patch) => set((s) => {
          const current = s.styleConfigs[resumeId] ? resolveStyleConfig(s.styleConfigs[resumeId]) : DEFAULT_STYLE_CONFIG;
          const next = resolveStyleConfig({ ...current, ...patch });
          return { styleConfigs: { ...s.styleConfigs, [resumeId]: next } };
        }),
        resetStyleConfig: (resumeId) => set((s) => {
          const styleConfigs = { ...s.styleConfigs };
          delete styleConfigs[resumeId];
          return { styleConfigs };
        }),
        suggestedClaims: [],
        evidence: [],
        trustScore: null,
        setTrustScore: (score) => set({ trustScore: score }),
        trustReport: null,
        setTrustReport: (report) => set({ trustReport: report }),
        careerProfile: null,
        setCareerProfile: (profile) => set({ careerProfile: profile }),
        rebuildCareerProfile: () => {
          const { resume } = get();
          const profile = buildCareerProfile(resume, {
            claims: resume.claims,
            evidence: get().evidence,
          });
          set({ careerProfile: profile });
          return profile;
        },
        setJobProfile: (profile) => set({ jobProfile: profile }),
        rebuildJobProfile: () => {
          const { jobDescription } = get();
          const profile = buildJobProfile(jobDescription);
          set({ jobProfile: profile });
          return profile;
        },
        setQualificationMatch: (match) => set({ qualificationMatch: match }),
        rebuildQualificationMatch: () => {
          const careerProfile = get().careerProfile;
          const jobProfile = get().jobProfile;
          if (!careerProfile || !jobProfile) return null;
          const match = buildQualificationMatch(careerProfile, jobProfile);
          set({ qualificationMatch: match });
          return match;
        },
        setResume: (newResume) => set((s) => {
          const currentId = s.activeResumeId;
          // Validate templateId - fall back to current if invalid
          const validTemplateId = TEMPLATES.some(t => t.id === newResume.templateId) 
            ? newResume.templateId 
            : s.resume.templateId;
          const updated = { 
            ...newResume, 
            resumeId: currentId, 
            resumeName: s.resume.resumeName || newResume.name || "My Resume",
            templateId: validTemplateId
          };
          const resumes = s.resumes.map((r) => r.resumeId === currentId ? updated : r);
          return { resumes, resume: updated, saveStatus: "unsaved" };
        }),
        updateField: (key, value) => set((s) => {
          const updatedResume = { ...s.resume, [key]: value };
          const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
          return { resumes, resume: updatedResume, saveStatus: "unsaved" };
        }),
        updateSocial: (key, value) => set((s) => {
          const updatedResume = { ...s.resume, social: { ...s.resume.social, [key]: value } };
          const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
          return { resumes, resume: updatedResume, saveStatus: "unsaved" };
        }),
        setActiveSection: (id) => set({ activeSection: id }),
        setCareerStage: (stage) => set((s) => {
          const updatedResume = { ...s.resume, careerStage: stage };
          const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
          return { resumes, resume: updatedResume, saveStatus: "unsaved" };
        }),
        resetResume: () => set((s) => {
          const currentId = s.activeResumeId;
          const currentName = s.resume.resumeName;
          const currentTemplate = s.resume.templateId;
          const resetR: Resume = { ...defaultResume, resumeId: currentId, resumeName: currentName, templateId: currentTemplate };
          const resumes = s.resumes.map((r) => r.resumeId === currentId ? resetR : r);
          return { resume: resetR, resumes, analysis: null, jobMatch: null, jobProfile: null, qualificationMatch: null, jobDescription: "", saveStatus: "unsaved", suggestedClaims: [], evidence: [], trustScore: null, trustReport: null, careerProfile: null };
        }),
        setSaveStatus: (status) => set({ saveStatus: status }),
        setServerVersion: (resumeId, version) => set((s) => ({
          serverVersions: { ...s.serverVersions, [resumeId]: version },
        })),
        clearWriteConflict: () => set({ writeConflict: null }),
        triggerWriteBack: () => {
          // Imported dynamically to avoid circular imports
          import("@/lib/resume-write-back").then(({ debouncedSave }) => {
            debouncedSave();
          });
        },
        setAnalysis: (analysis) => set({ analysis }), setAnalysisLoading: (loading) => set({ analysisLoading: loading }),
        setJobMatch: (match) => set({ jobMatch: match }), setJobDescription: (desc) => set({ jobDescription: desc }),
        setAIAction: (key, state) => set((s) => ({ aiActions: { ...s.aiActions, [key]: { ...(s.aiActions[key] ?? { status: "idle", result: null, error: null }), ...state } } })),
        setCopilotOpen: (open) => set({ isCopilotOpen: open }), setJobMatchOpen: (open) => set({ isJobMatchOpen: open }), setPreviewTab: (tab) => set({ previewTab: tab }),
        applyTemplate: (templateId) => {
          // Only the template changes — every other field of the user's resume
          // (name, contact, sections, font/color customization) stays intact.
          if (TEMPLATES.some((t) => t.id === templateId)) {
            set((s) => {
              const updatedResume = {
                ...s.resume,
                templateId,
              };
              const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
              return { resumes, resume: updatedResume, saveStatus: "unsaved" };
            });
          }
        },
        setSuggestedClaims: (claims) => set({ suggestedClaims: claims }),
        acceptClaim: (suggestion) =>
          set((s) => {
            const claim: Claim = {
              id: uid(),
              assertionText: suggestion.assertionText,
              claimType: suggestion.claimType,
              sourceActivityId: suggestion.sourceActivityId,
              confidence: suggestion.confidence,
              reasoning: suggestion.reasoning,
              verificationStatus: "accepted",
              reviewed: true,
              accepted: true,
              createdAt: new Date().toISOString(),
            };
            const updatedResume = { ...s.resume, claims: [...s.resume.claims, claim] };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return {
              resume: updatedResume,
              resumes,
              suggestedClaims: s.suggestedClaims.filter((c) => c.assertionText !== suggestion.assertionText),
              saveStatus: "unsaved",
            };
          }),
        acceptEditedClaim: (suggestion, editedText) =>
          set((s) => {
            const claim: Claim = {
              id: uid(),
              assertionText: editedText.trim() || suggestion.assertionText,
              claimType: suggestion.claimType,
              sourceActivityId: suggestion.sourceActivityId,
              confidence: suggestion.confidence,
              reasoning: suggestion.reasoning,
              verificationStatus: "accepted",
              reviewed: true,
              accepted: true,
              createdAt: new Date().toISOString(),
            };
            const updatedResume = { ...s.resume, claims: [...s.resume.claims, claim] };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return {
              resume: updatedResume,
              resumes,
              suggestedClaims: s.suggestedClaims.filter((c) => c.assertionText !== suggestion.assertionText),
              saveStatus: "unsaved",
            };
          }),
        rejectClaim: (index) =>
          set((s) => ({
            suggestedClaims: s.suggestedClaims.filter((_, i) => i !== index),
          })),
        persistClaim: (claim) =>
          set((s) => {
            const updatedResume = {
              ...s.resume,
              claims: s.resume.claims.some((c) => c.id === claim.id)
                ? s.resume.claims.map((c) => (c.id === claim.id ? claim : c))
                : [...s.resume.claims, claim],
            };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resume: updatedResume, resumes, saveStatus: "unsaved" };
          }),
        updateClaim: (id, updates) =>
          set((s) => {
            const updatedResume = {
              ...s.resume,
              claims: s.resume.claims.map((c) => (c.id === id ? { ...c, ...updates } : c)),
            };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resume: updatedResume, resumes, saveStatus: "unsaved" };
          }),
        addEvidence: (evidence) =>
          set((s) => {
            const claim = s.resume.claims.find((c) => c.id === evidence.claimId);
            if (!claim) return s;
            const updated = [...s.evidence, evidence];
            let claims = s.resume.claims;
            if (claim.accepted && claim.verificationStatus === "accepted") {
              claims = s.resume.claims.map((c) =>
                c.id === claim.id ? { ...c, verificationStatus: "evidence-added" as const } : c,
              );
            }
            const updatedResume = { ...s.resume, claims };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resume: updatedResume, resumes, evidence: updated, saveStatus: "unsaved" };
          }),
        updateEvidence: (id, updates) =>
          set((s) => ({
            evidence: s.evidence.map((e) =>
              e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e,
            ),
            saveStatus: "unsaved",
          })),
        removeEvidence: (id) =>
          set((s) => {
            const target = s.evidence.find((e) => e.id === id);
            const evidence = s.evidence.filter((e) => e.id !== id);
            let claims = s.resume.claims;
            if (target && !evidence.some((e) => e.claimId === target.claimId)) {
              claims = s.resume.claims.map((c) =>
                c.id === target.claimId && c.verificationStatus !== "accepted"
                  ? { ...c, verificationStatus: "accepted" as const }
                  : c,
              );
            }
            const updatedResume = { ...s.resume, claims };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return { resume: updatedResume, resumes, evidence, saveStatus: "unsaved" };
          }),
        setEvidenceStatus: (id, status) =>
          set((s) => ({
            evidence: s.evidence.map((e) =>
              e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e,
            ),
            saveStatus: "unsaved",
          })),
        setEvidenceConsent: (id, consent) =>
          set((s) => ({
            evidence: s.evidence.map((e) =>
              e.id === id ? { ...e, consent, updatedAt: new Date().toISOString() } : e,
            ),
            saveStatus: "unsaved",
          })),
        setEvidenceVisibility: (id, visibility) =>
          set((s) => ({
            evidence: s.evidence.map((e) =>
              e.id === id ? { ...e, visibility, updatedAt: new Date().toISOString() } : e,
            ),
            saveStatus: "unsaved",
          })),
        markClaimReadyForReview: (claimId) =>
          set((s) => {
            const updatedResume = {
              ...s.resume,
              claims: s.resume.claims.map((c) =>
                c.id === claimId && c.verificationStatus === "evidence-added"
                  ? { ...c, verificationStatus: "under-review" as const }
                  : c,
              ),
            };
            const resumes = s.resumes.map((r) => r.resumeId === s.activeResumeId ? updatedResume : r);
            return {
              resume: updatedResume,
              resumes,
              evidence: s.evidence.map((e) =>
                e.claimId === claimId && e.status === "evidence-added"
                  ? { ...e, status: "under-review" as const, updatedAt: new Date().toISOString() }
                  : e,
              ),
              saveStatus: "unsaved",
            };
          }),
        evidenceForClaim: (claimId) => get().evidence.filter((e) => e.claimId === claimId),
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
            const result = await ai.analyzeResume(resume);
            set({ analysis: result, analysisLoading: false });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "AI analysis failed.";
            set({ analysis: { status: "error", dataSufficiencyNote: message, phases: [], resumeScore: { overall: null, grammar: null, readability: null, keywordMatch: null, structure: null }, trustScore: { careerStage: resume.careerStage || "working-professional", components: [], overall: null, improvementSuggestions: [] }, atsScore: null, professionalImpact: null, missingSections: [], weakBulletPoints: [], weakActionVerbs: [], missingMetrics: [], missingCertifications: [], missingSocialLinks: [], suggestions: [] }, analysisLoading: false });
          }
        },
        progress: () => {
          const sections: SectionId[] = ["personal", "experience", "education", "skills", "projects", "certifications", "achievements", "languages", "portfolio"];
          const complete = sections.filter((sec) => get().sectionComplete(sec));
          return Math.round((complete.length / sections.length) * 100);
        },
        resumeScore: () => get().analysis?.resumeScore?.overall ?? null,
        sectionComplete: (section: SectionId) => {
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
  };

/**
 * Merge persisted state into the current store on rehydration.
 *
 * The store used to persist a single top-level `resume` object (`{ resume,
 * evidence }`). The multi-resume store persists a `resumes` array instead.
 * Zustand's DEFAULT shallow merge (`{ ...current, ...persisted }`) would put
 * the legacy resume into `state.resume` while leaving the store's non-empty
 * placeholder `resumes` array untouched — and the placeholder (a blank
 * default resume) would then be persisted over the user's real data on the
 * first write after hydration. This merge migrates the legacy shape into the
 * multi-resume array BEFORE hydration completes so real resume data (and the
 * selected templateId) is never lost.
 */
export function mergePersistedResumeState(
  persisted: unknown,
  current: ResumeBuilderState,
): ResumeBuilderState {
  const p = (persisted ?? {}) as Partial<ResumeBuilderState> & { resume?: Partial<Resume> };
  // Legacy single-resume shape: persisted `resume` with no `resumes` array.
  if (p.resume && !Array.isArray(p.resumes)) {
    const legacy: Resume = { ...defaultResume, ...p.resume } as Resume;
    const migratedId = legacy.resumeId || uid();
    const migrated: Resume = {
      ...legacy,
      resumeId: migratedId,
      resumeName: legacy.resumeName || legacy.name || "My Resume",
    };
    return {
      ...current,
      ...p,
      resumes: [migrated],
      activeResumeId: migratedId,
      resume: migrated,
    };
  }
  // Current multi-resume shape (or an empty/unknown payload): keep zustand's
  // default shallow merge behavior.
  return { ...current, ...p };
}

export const useResumeBuilder = create<ResumeBuilderState>()(
  persist(
    resumeStore,
    {
      name: "patorbit-resume-v2",
      merge: mergePersistedResumeState,
      partialize: (state) => ({ resumes: state.resumes, activeResumeId: state.activeResumeId, evidence: state.evidence, styleConfigs: state.styleConfigs, serverVersions: state.serverVersions }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          let resumes = state.resumes;
          if (!Array.isArray(resumes) || resumes.length === 0) {
            const oldResume = (state as any).resume;
            const base = oldResume ? { ...defaultResume, ...oldResume } : defaultResume;
            resumes = [{
              ...base,
              resumeId: base.resumeId || uid(),
              resumeName: base.resumeName || base.name || "My Resume",
            }];
          } else {
            resumes = resumes.map((r) => ({ ...defaultResume, ...r, resumeId: r.resumeId || uid(), resumeName: r.resumeName || r.name || "My Resume" }));
          }
          const activeResumeId = state.activeResumeId && resumes.some((r) => r.resumeId === state.activeResumeId)
            ? state.activeResumeId
            : resumes[0].resumeId;
          const resume = resumes.find((r) => r.resumeId === activeResumeId) || resumes[0];
          state.resumes = resumes;
          state.activeResumeId = activeResumeId!;
          state.resume = resume;
          state.evidence = state.evidence ?? [];
          state.styleConfigs = state.styleConfigs ?? {};
          state.serverVersions = state.serverVersions ?? {};
          state.writeConflict = null;
          state.setSaveStatus("saved");
          state.hydrated = true;
        }
      },
    },
  ),
);

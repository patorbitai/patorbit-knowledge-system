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
import { hasSufficientData } from "@/types/resume";
import { ai } from "@/lib/ai/client";
import { TEMPLATES } from "@/app/resume-builder/templates";

/* ── Defaults ── */

const defaultSocial = { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" };

export const defaultResume: Resume = {
  name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "",
  social: defaultSocial, experience: [], education: [], skills: [], projects: [], certifications: [],
  languages: [], interests: [], achievements: [], references: [], portfolio: [], templateId: "modern-clean",
  careerStage: "working-professional", fontPreference: "inter", palettePreference: "slate",
  claims: [],
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
  /** AI-suggested claims awaiting user review (Claims Review workflow). */
  suggestedClaims: SuggestedClaim[];
  /** Evidence attached to accepted claims (Slice 2). */
  evidence: Evidence[];
  /** Trust score snapshot, derived from the graph, for UI presentation. */
  trustScore: TrustSnapshot | null;
  /** Set the trust score snapshot. Called by the coordinator. */
  setTrustScore: (score: TrustSnapshot | null) => void;
  /** Rich trust report (snapshot + verification + coverage + weak claims), derived from the graph. */
  trustReport: TrustReport | null;
  /** Set the rich trust report. Called by the coordinator. */
  setTrustReport: (report: TrustReport | null) => void;
  /** Add a new evidence record to an accepted claim. */
  addEvidence: (evidence: Evidence) => void;
  /** Update a persisted evidence record (e.g. status change, notes edit). */
  updateEvidence: (id: string, updates: Partial<Evidence>) => void;
  /** Remove an evidence record from a claim. */
  removeEvidence: (id: string) => void;
  /** Set a single evidence record's verification status. */
  setEvidenceStatus: (id: string, status: EvidenceStatus) => void;
  /** Toggle explicit user consent for an evidence record. */
  setEvidenceConsent: (id: string, consent: boolean) => void;
  /** Toggle an evidence record's visibility (public/private). */
  setEvidenceVisibility: (id: string, visibility: EvidenceVisibility) => void;
  /** Mark all of a claim's evidence as ready for review. */
  markClaimReadyForReview: (claimId: string) => void;
  /** Get all evidence for a claim id. */
  evidenceForClaim: (claimId: string) => Evidence[];
  setResume: (resume: Resume) => void;
  updateField: <K extends keyof Resume>(key: K, value: Resume[K]) => void;
  updateSocial: (key: keyof typeof defaultSocial, value: string) => void;
  setActiveSection: (id: SectionId) => void;
  setCareerStage: (stage: import("@/types/resume").CareerStage) => void;
  resetResume: () => void;
  applyTemplate: (templateId: string) => void;
  setSuggestedClaims: (claims: SuggestedClaim[]) => void;
  /** Accept a suggested claim into the Professional Identity (never automatic). */
  acceptClaim: (suggestion: SuggestedClaim) => void;
  /** Edit + accept a suggested claim. */
  acceptEditedClaim: (suggestion: SuggestedClaim, editedText: string) => void;
  /** Remove a suggested claim from the review queue. */
  rejectClaim: (index: number) => void;
  /** Persist an accepted claim back into the resume. */
  persistClaim: (claim: Claim) => void;
  /** Update a persisted claim (e.g. edit after acceptance). */
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
  setJobMatchOpen: (open: boolean) => void; setPreviewTab: (tab: "resume" | "passport" | "knowledge-graph" | "trust-timeline") => void;
  setSaveStatus: (status: SaveStatus) => void;
  progress: () => number; resumeScore: () => number | null; sectionComplete: (section: SectionId) => boolean; getSaveStatus: () => SaveStatus;
}

/* ── Store ── */

export const resumeStore: StateCreator<ResumeBuilderState> = (set, get) => {
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
        suggestedClaims: [],
        evidence: [],
        trustScore: null,
        setTrustScore: (score) => set({ trustScore: score }),
        trustReport: null,
        setTrustReport: (report) => set({ trustReport: report }),
        setResume: (resume) => set({ resume, saveStatus: "unsaved" }),
        updateField: (key, value) => set((s) => ({ resume: { ...s.resume, [key]: value }, saveStatus: "unsaved" })),
        updateSocial: (key, value) => set((s) => ({ resume: { ...s.resume, social: { ...s.resume.social, [key]: value } }, saveStatus: "unsaved" })),
        setActiveSection: (id) => set({ activeSection: id }),
        setCareerStage: (stage) => set((s) => ({ resume: { ...s.resume, careerStage: stage }, saveStatus: "unsaved" })),
        resetResume: () => set({ resume: defaultResume, analysis: null, jobMatch: null, saveStatus: "unsaved", suggestedClaims: [], evidence: [], trustScore: null, trustReport: null }),
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
            return {
              resume: { ...s.resume, claims: [...s.resume.claims, claim] },
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
            return {
              resume: { ...s.resume, claims: [...s.resume.claims, claim] },
              suggestedClaims: s.suggestedClaims.filter((c) => c.assertionText !== suggestion.assertionText),
              saveStatus: "unsaved",
            };
          }),
        rejectClaim: (index) =>
          set((s) => ({
            suggestedClaims: s.suggestedClaims.filter((_, i) => i !== index),
          })),
        persistClaim: (claim) =>
          set((s) => ({
            resume: {
              ...s.resume,
              claims: s.resume.claims.some((c) => c.id === claim.id)
                ? s.resume.claims.map((c) => (c.id === claim.id ? claim : c))
                : [...s.resume.claims, claim],
            },
            saveStatus: "unsaved",
          })),
        updateClaim: (id, updates) =>
          set((s) => ({
            resume: {
              ...s.resume,
              claims: s.resume.claims.map((c) => (c.id === id ? { ...c, ...updates } : c)),
            },
            saveStatus: "unsaved",
          })),
        addEvidence: (evidence) =>
          set((s) => {
            // Evidence may only attach to accepted claims.
            const claim = s.resume.claims.find((c) => c.id === evidence.claimId);
            if (!claim) return s;
            const updated = [...s.evidence, evidence];
            // Project claim status: accepted → evidence-added when first evidence lands.
            let claims = s.resume.claims;
            if (claim.accepted && claim.verificationStatus === "accepted") {
              claims = s.resume.claims.map((c) =>
                c.id === claim.id ? { ...c, verificationStatus: "evidence-added" as const } : c,
              );
            }
            return { resume: { ...s.resume, claims }, evidence: updated, saveStatus: "unsaved" };
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
            // If a claim lost its last evidence, revert its status to accepted.
            let claims = s.resume.claims;
            if (target && !evidence.some((e) => e.claimId === target.claimId)) {
              claims = s.resume.claims.map((c) =>
                c.id === target.claimId && c.verificationStatus !== "accepted"
                  ? { ...c, verificationStatus: "accepted" as const }
                  : c,
              );
            }
            return { resume: { ...s.resume, claims }, evidence, saveStatus: "unsaved" };
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
          set((s) => ({
            resume: {
              ...s.resume,
              claims: s.resume.claims.map((c) =>
                c.id === claimId && c.verificationStatus === "evidence-added"
                  ? { ...c, verificationStatus: "under-review" as const }
                  : c,
              ),
            },
            // Mark all of the claim's evidence as under-review too.
            evidence: s.evidence.map((e) =>
              e.claimId === claimId && e.status === "evidence-added"
                ? { ...e, status: "under-review" as const, updatedAt: new Date().toISOString() }
                : e,
            ),
            saveStatus: "unsaved",
          })),
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

export const useResumeBuilder = create<ResumeBuilderState>()(
  persist(
    resumeStore,
    {
      name: "patorbit-resume-v2",
      partialize: (state) => ({ resume: state.resume, evidence: state.evidence }),
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

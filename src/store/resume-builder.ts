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
  duplicateResume: (sourceResumeId: string) => string;

  activeSection: SectionId;  saveStatus: SaveStatus;
  /** True after Zustand persist has rehydrated from localStorage. */
  hydrated: boolean;
  /** True while server-first hydration is in progress (prevents write-back loop). */
  hydratingFromServer: boolean;
  /** Server version per resume — populated by sync, used by write-back. */
  serverVersions: Record<string, number>;
  /** Resume IDs that have been deleted locally and are pending server-side deletion. */
  pendingDeletes: string[];
  /** Conflict state: set when a write-back gets 409 CONFLICT. */
  writeConflict: {
    resumeId: string;
    localResume: Resume;
    serverResume: Resume;
    localBaseVersion?: number;
    serverVersion: number;
  } | null;
  setWriteConflict: (conflict: ResumeBuilderState["writeConflict"]) => void;
  clearWriteConflict: () => void;
  resolveConflictKeepMine: () => Promise<void>;
  resolveConflictUseServer: () => void;
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
  hydrateFromServer: (serverResumes: Array<{ resumeId: string; resumeName: string; templateId: string; careerStage: string; resume: Record<string, unknown>; version: number }>) => void;
  /** Remove a resume ID from the pending deletes list (after server confirms deletion). */
  clearPendingDelete: (resumeId: string) => void;
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

          // C30: Fire explicit POST to create the resume on the server
          import("@/lib/resume-write-back").then(({ markCreating, clearCreating }) => {
            markCreating(id);
            fetch("/api/resumes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resumeId: id,
                resumeName: newName,
                templateId: newResume.templateId,
                careerStage: newResume.careerStage,
                resume: newResume,
              }),
            })
              .then((res) => {
                if (res.ok) {
                  return res.json().then((data: { version?: number }) => {
                    if (data.version !== undefined) {
                      get().setServerVersion(id, data.version);
                    }
                    get().setSaveStatus("saved");
                  });
                }
                // 409 cross-identity conflict — regenerate ID
                if (res.status === 409) {
                  return res.json().then((body: { error?: string }) => {
                    if (body.error === "resumeId_conflict") {
                      const newId = `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                      const st = get();
                      const updated = { ...st.resume, resumeId: newId };
                      const resumes = st.resumes.map((r) => r.resumeId === id ? updated : r);
                      set({ resume: updated, resumes, activeResumeId: newId, saveStatus: "unsaved" });
                    }
                  });
                }
                // Other errors — leave as unsaved, write-back will retry
              })
              .catch(() => {
                // Network error — leave as unsaved, write-back will retry
              })
              .finally(() => {
                clearCreating(id);
              });
          }).catch(() => {
            // Module not available (test env) — safe to skip
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
          const state = get();
          if (state.resumes.length <= 1) return;

          // 1. Immediately update local state (fast UI response)
          set((s) => {
            const resumes = s.resumes.filter((r) => r.resumeId !== resumeId);
            const activeResumeId = s.activeResumeId === resumeId ? resumes[0].resumeId : s.activeResumeId;
            const resume = resumes.find((r) => r.resumeId === activeResumeId) || resumes[0];
            return { resumes, activeResumeId, resume, saveStatus: "unsaved" };
          });

          // 2. Cancel any pending write-back for this resume (prevents resurrection)
          // Uses dynamic import to avoid circular dependency; gracefully handles test environments
          import("@/lib/resume-write-back").then(({ cancelPendingSave }) => {
            cancelPendingSave(resumeId);
          }).catch(() => {
            // Module not available (test environment) — safe to skip
          });

          // 3. Remove from serverVersions
          set((s) => {
            const sv = { ...s.serverVersions };
            delete sv[resumeId];
            return { serverVersions: sv };
          });

          // 4. Track as pending delete (for hydration + write-back guards)
          set((s) => ({
            pendingDeletes: s.pendingDeletes.includes(resumeId)
              ? s.pendingDeletes
              : [...s.pendingDeletes, resumeId],
          }));

          // 5. Fire server DELETE (async, best-effort)
          fetch(`/api/resumes/${resumeId}`, { method: "DELETE" })
            .then((res) => {
              if (res.ok) {
                // Server confirmed deletion — remove from pending deletes
                get().clearPendingDelete(resumeId);
              }
              // 404 = already deleted on server — also safe to clear
              if (res.status === 404) {
                get().clearPendingDelete(resumeId);
              }
              // Other errors: keep in pendingDeletes for retry on next hydration
            })
            .catch(() => {
              // Network error — keep in pendingDeletes, will be retried on next hydration
            });
        },
        duplicateResume: (sourceResumeId: string) => {
          const state = get();
          const source = state.resumes.find((r) => r.resumeId === sourceResumeId);
          if (!source) return "";

          // Generate new identity
          const newId = uid();
          const originalName = source.resumeName || source.name || "Resume";
          const newName = `${originalName} (Copy)`;

          // Deep clone resume content (avoid shared mutable references)
          const duplicate: Resume = {
            ...JSON.parse(JSON.stringify(source)),
            resumeId: newId,
            resumeName: newName,
          };

          // Insert locally and make active
          set((s) => {
            const resumes = [...s.resumes, duplicate];
            // Copy style configuration from source
            const newStyleConfigs = { ...s.styleConfigs };
            if (s.styleConfigs[sourceResumeId]) {
              newStyleConfigs[newId] = JSON.parse(JSON.stringify(s.styleConfigs[sourceResumeId]));
            }
            return { resumes, activeResumeId: newId, resume: duplicate, saveStatus: "unsaved" as const, styleConfigs: newStyleConfigs };
          });

          // Explicit POST to server (C30 pattern)
          import("@/lib/resume-write-back").then(({ markCreating, clearCreating }) => {
            markCreating(newId);
            fetch("/api/resumes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resumeId: newId,
                resumeName: newName,
                templateId: duplicate.templateId,
                careerStage: duplicate.careerStage,
                resume: duplicate,
              }),
            })
              .then((res) => {
                if (res.ok) {
                  return res.json().then((data: { version?: number }) => {
                    if (data.version !== undefined) {
                      get().setServerVersion(newId, data.version);
                    }
                    get().setSaveStatus("saved");
                  });
                }
              })
              .catch(() => {}) // leave as unsaved, write-back will retry
              .finally(() => { clearCreating(newId); });
          }).catch(() => {});

          return newId;
        },

        analysis: null, activeSection: "personal", saveStatus: "unsaved",
        hydrated: false, hydratingFromServer: false,
        serverVersions: {}, pendingDeletes: [], writeConflict: null,
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
        setWriteConflict: (conflict) => set({ writeConflict: conflict }),
        clearWriteConflict: () => set({ writeConflict: null }),
        resolveConflictKeepMine: async () => {
          const state = get();
          const conflict = state.writeConflict;
          if (!conflict) return;
          // Re-fetch latest server version to ensure we have the true current version
          try {
            const res = await fetch(`/api/resumes/${conflict.resumeId}`);
            if (!res.ok) return;
            const serverData = await res.json() as { version?: number };
            const latestVersion = serverData.version ?? conflict.serverVersion;
            // Retry with local resume + latest server version as base
            state.setServerVersion(conflict.resumeId, latestVersion);
            state.clearWriteConflict();
            state.setSaveStatus("unsaved");
            // Trigger a debounced save which will use the updated serverVersion
            import("@/lib/resume-write-back").then(({ debouncedSave }) => {
              debouncedSave();
            });
          } catch {
            // Network error — keep conflict open for retry
          }
        },
        resolveConflictUseServer: () => {
          const state = get();
          const conflict = state.writeConflict;
          if (!conflict) return;
          const serverResume = conflict.serverResume as Resume;
          // Replace only the conflicted resume — preserve resumeId
          const updated = {
            ...serverResume,
            resumeId: conflict.resumeId,
          };
          const resumes = state.resumes.map((r) =>
            r.resumeId === conflict.resumeId ? updated : r,
          );
          set({
            resumes,
            resume: state.activeResumeId === conflict.resumeId ? updated : state.resume,
            serverVersions: { ...state.serverVersions, [conflict.resumeId]: conflict.serverVersion },
            writeConflict: null,
            saveStatus: "saved",
          });
        },
        triggerWriteBack: () => {
          // Imported dynamically to avoid circular imports
          import("@/lib/resume-write-back").then(({ debouncedSave }) => {
            debouncedSave();
          });
        },
        clearPendingDelete: (resumeId: string) => {
          set((s) => ({
            pendingDeletes: s.pendingDeletes.filter((id) => id !== resumeId),
          }));
        },
        hydrateFromServer: (serverResumes) => {
          const state = get();
          const localResumes = state.resumes;

          // Determine if local state is effectively empty:
          // a single resume that matches the default (blank name, no sections, default template)
          const isLocalEmpty = localResumes.length === 1 && (() => {
            const r = localResumes[0];
            return (
              !r.name && !r.title && !r.email && !r.summary &&
              r.experience.length === 0 && r.education.length === 0 &&
              r.skills.length === 0 && r.projects.length === 0 &&
              r.templateId === "modern-clean"
            );
          })();

          if (!isLocalEmpty && serverResumes.length === 0) return;

          // Set flag to prevent write-back loop during hydration
          set({ hydratingFromServer: true });

          const pendingDeleteSet = new Set(state.pendingDeletes);
          const eligibleServerResumes = serverResumes.filter((s) => !pendingDeleteSet.has(s.resumeId));
          const serverById = new Map(eligibleServerResumes.map((s) => [s.resumeId, s]));
          const localById = new Map(localResumes.map((r) => [r.resumeId ?? "", r]));

          const mergedResumes: Resume[] = [];
          const newVersions: Record<string, number> = { ...state.serverVersions };

          // Process each eligible server resume (excluding pending deletes)
          for (const server of eligibleServerResumes) {
            newVersions[server.resumeId] = server.version;
            const local = localById.get(server.resumeId);

            if (local && !isLocalEmpty) {
              // Both exist — preserve local (it may have unsaved edits)
              mergedResumes.push(local);
            } else {
              // Server-only or local is empty — hydrate from server
              const serverDoc = server.resume as Record<string, unknown>;
              const hydrated: Resume = {
                ...defaultResume,
                ...(serverDoc as Partial<Resume>),
                resumeId: server.resumeId,
                resumeName: server.resumeName,
                templateId: server.templateId,
                careerStage: server.careerStage as Resume["careerStage"],
              };
              mergedResumes.push(hydrated);
            }
          }

          // Add LOCAL_ONLY resumes (not on server) — but only if local state was not empty.
          // When local is empty, the default placeholder should not survive hydration.
          if (!isLocalEmpty) {
            for (const local of localResumes) {
              const lid = local.resumeId ?? "";
              if (!serverById.has(lid)) {
                mergedResumes.push(local);
              }
            }
          }

          // Select active resume
          let activeResumeId = state.activeResumeId;
          const hasActive = mergedResumes.some((r) => r.resumeId === activeResumeId);
          if (!hasActive) {
            activeResumeId = mergedResumes[0]?.resumeId ?? uid();
          }

          const activeResume = mergedResumes.find((r) => r.resumeId === activeResumeId) ?? mergedResumes[0];

          // Batch update: set all state at once, then clear hydration flag
          set({
            resumes: mergedResumes,
            activeResumeId,
            resume: activeResume,
            serverVersions: newVersions,
            saveStatus: "saved" as const,
            hydratingFromServer: false,
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

/* ── Active Resume Reconciliation ───────────────────────────────────────── */

/**
 * Ensure `activeResumeId` references a valid resume in `resumes[]`.
 * If the ID is missing or stale, falls back to the first available resume.
 * Returns the corrected values WITHOUT mutating the store — the caller
 * must call `setState()` if changes are needed.
 */
function reconcileActiveResumeValues(state: {
  resumes: Resume[];
  activeResumeId: string;
  resume: Resume;
}) {
  let { resumes, activeResumeId, resume } = state;

  // Guarantee resumes is a non-empty array
  if (!Array.isArray(resumes) || resumes.length === 0) {
    const fallback = { ...defaultResume, resumeId: uid(), resumeName: "My Resume" };
    return { resumes: [fallback], activeResumeId: fallback.resumeId, resume: fallback };
  }

  // Ensure every resume has required fields
  resumes = resumes.map((r) => ({
    ...defaultResume,
    ...r,
    resumeId: r.resumeId || uid(),
    resumeName: r.resumeName || r.name || "My Resume",
  }));

  // If activeResumeId is missing or doesn't match any resume, pick the first one
  const idValid = activeResumeId && resumes.some((r) => r.resumeId === activeResumeId);
  if (!idValid) {
    activeResumeId = resumes[0].resumeId!;
  }

  // Derive the active resume object from the array
  const found = resumes.find((r) => r.resumeId === activeResumeId);
  if (found) {
    resume = found;
  }

  return { resumes, activeResumeId, resume };
}

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
      partialize: (state) => ({ resumes: state.resumes, activeResumeId: state.activeResumeId, evidence: state.evidence, styleConfigs: state.styleConfigs, serverVersions: state.serverVersions, pendingDeletes: state.pendingDeletes }),
      onRehydrateStorage: () => (snapshot) => {
        // In Zustand v5 the `snapshot` parameter may be stale — the persist
        // middleware's own internal setState(merged) may not have fired yet.
        // We ALWAYS reconcile from the LIVE store to guarantee correctness.
        //
        // Strategy:
        // 1. Immediate reconciliation from the snapshot (fast path)
        // 2. Deferred reconciliation via setTimeout(0) from the LIVE store
        //    (safety net against Zustand v5 timing issues)
        //
        const applyReconciled = () => {
          const live = useResumeBuilder.getState();
          const { resumes, activeResumeId, resume } = reconcileActiveResumeValues({
            resumes: live.resumes,
            activeResumeId: live.activeResumeId,
            resume: live.resume,
          });
          useResumeBuilder.setState({
            resumes,
            activeResumeId,
            resume,
            evidence: live.evidence ?? [],
            styleConfigs: live.styleConfigs ?? {},
            serverVersions: live.serverVersions ?? {},
            pendingDeletes: live.pendingDeletes ?? [],
            writeConflict: null,
            saveStatus: "saved" as const,
            hydrated: true,
          });
        };

        // First pass: immediate reconciliation from snapshot
        if (snapshot) {
          const { resumes, activeResumeId, resume } = reconcileActiveResumeValues({
            resumes: snapshot.resumes,
            activeResumeId: snapshot.activeResumeId,
            resume: (snapshot as any).resume ?? defaultResume,
          });
          useResumeBuilder.setState({
            resumes,
            activeResumeId,
            resume,
            evidence: snapshot.evidence ?? [],
            styleConfigs: snapshot.styleConfigs ?? {},
            serverVersions: snapshot.serverVersions ?? {},
            pendingDeletes: snapshot.pendingDeletes ?? [],
            writeConflict: null,
            saveStatus: "saved" as const,
            hydrated: true,
          });
        }

        // Safety net: re-reconcile from LIVE store after microtask
        // This catches the case where Zustand v5's internal merge overwrites
        // our correction, or the snapshot was stale.
        setTimeout(applyReconciled, 0);
      },
    },
  ),
);

/* ── Self-healing subscription ───────────────────────────────────────────
 *
 * Keeps `resume` in sync with `activeResumeId` on every state change.
 * This is a safety net that catches any case where:
 * - Zustand v5's persist middleware overwrites the correction
 * - Server sync changes activeResumeId
 * - Resume deletion changes activeResumeId
 * - Any other code path creates a mismatch
 *
 * The subscription is idempotent: if `resume` already matches,
 * it does nothing.
 */
if (typeof window !== "undefined") {
  useResumeBuilder.subscribe((state) => {
    // Only reconcile after hydration
    if (!state.hydrated) return;
    // Check if the active resume object matches activeResumeId
    const found = state.resumes.find((r) => r.resumeId === state.activeResumeId);
    if (found && found !== state.resume) {
      // Resume is out of sync — correct it
      useResumeBuilder.setState({ resume: found });
    }
  });
}

// Expose store for E2E testing (dev/staging only — stripped from production builds)
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as any).__resumeStore__ = useResumeBuilder;
}

// apps/web/src/lib/stores/use-resume-store.ts
import { create } from 'zustand';

import { api } from '@/lib/api';
import { type Resume, type ResumeSection, type ResumeVersion } from '@/lib/types';

// ── Types ────────────────────────────────────────────────────────────────────

export type ResumeMessage = { type: 'success' | 'error'; text: string } | null;

export type ResumeStore = {
  resume: Resume | null;
  versions: ResumeVersion[];
  isLoading: boolean;
  isSaving: boolean;
  savingSectionId: string | null;
  message: ResumeMessage;

  loadResume: (id: string) => Promise<void>;
  loadVersions: (id: string) => Promise<void>;
  updateSectionContent: (sectionId: string, content: Record<string, unknown>) => void;
  flushSection: (sectionId: string) => Promise<void>;
  toggleSection: (sectionId: string) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  addSection: (resumeId: string, type: string, title?: string) => Promise<void>;
  setTitle: (title: string) => void;
  flushTitle: () => Promise<void>;
  duplicateResume: () => Promise<void>;
  archiveResume: () => Promise<void>;
  createVersion: (note?: string) => Promise<void>;
  setMessage: (msg: ResumeMessage) => void;
  reset: () => void;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const pendingSaves = new Map<string, Record<string, unknown>>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleFlush(
  sectionId: string,
  content: Record<string, unknown>,
  flush: (id: string) => void,
) {
  pendingSaves.set(sectionId, content);
  const existing = saveTimers.get(sectionId);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    sectionId,
    setTimeout(() => {
      pendingSaves.delete(sectionId);
      saveTimers.delete(sectionId);
      flush(sectionId);
    }, 800),
  );
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useResumeStore = create<ResumeStore>()((set, get) => ({
  resume: null,
  versions: [],
  isLoading: false,
  isSaving: false,
  savingSectionId: null,
  message: null,

  // ── Loaders ──────────────────────────────────────────────────────────────

  loadResume: async (id: string) => {
    set({ isLoading: true, message: null });
    try {
      const data = await api.get<Resume>(`/resumes/${id}`);
      set({ resume: data, isLoading: false });
    } catch {
      set({ isLoading: false, message: { type: 'error', text: 'Failed to load resume' } });
    }
  },

  loadVersions: async (id: string) => {
    try {
      const data = await api.get<ResumeVersion[]>(`/resumes/${id}/versions`);
      set({ versions: data });
    } catch {
      /* silent */
    }
  },

  // ── Section content: instant local update + debounced API sync ──────────

  updateSectionContent: (sectionId: string, content: Record<string, unknown>) => {
    const { resume, flushSection } = get();
    if (!resume) return;

    // Instant local update for live preview
    set({
      resume: {
        ...resume,
        sections: resume.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)),
      },
    });

    // Debounce the API call
    scheduleFlush(sectionId, content, flushSection);
  },

  flushSection: async (sectionId: string) => {
    const { resume } = get();
    if (!resume) return;

    const content = pendingSaves.get(sectionId);
    if (!content) return;

    set({ savingSectionId: sectionId });
    try {
      await api.patch(`/resumes/${resume.id}/sections/${sectionId}`, { content });
    } catch {
      set({ message: { type: 'error', text: 'Failed to save section' } });
    } finally {
      set({ savingSectionId: null });
    }
  },

  toggleSection: async (sectionId: string) => {
    const { resume } = get();
    if (!resume) return;

    set({
      resume: {
        ...resume,
        sections: resume.sections.map((s) =>
          s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s,
        ),
      },
    });

    try {
      await api.patch(`/resumes/${resume.id}/sections/${sectionId}/toggle`, {});
    } catch {
      set({ message: { type: 'error', text: 'Failed to update section' } });
      // Revert
      const current = get().resume;
      if (current) {
        set({
          resume: {
            ...current,
            sections: current.sections.map((s) =>
              s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s,
            ),
          },
        });
      }
    }
  },

  deleteSection: async (sectionId: string) => {
    const { resume } = get();
    if (!resume) return;

    const originalSections = resume.sections;
    set({ resume: { ...resume, sections: resume.sections.filter((s) => s.id !== sectionId) } });

    try {
      await api.del(`/resumes/${resume.id}/sections/${sectionId}`);
    } catch {
      set({
        resume: { ...resume, sections: originalSections },
        message: { type: 'error', text: 'Failed to delete section' },
      });
    }
  },

  addSection: async (resumeId: string, type: string, title?: string) => {
    try {
      const created = await api.post<ResumeSection>(`/resumes/${resumeId}/sections`, {
        type,
        ...(title && { title }),
      });
      set((prev) => ({
        resume: prev.resume
          ? { ...prev.resume, sections: [...prev.resume.sections, created] }
          : null,
        message: { type: 'success', text: 'Section added' },
      }));
    } catch {
      set({ message: { type: 'error', text: 'Failed to add section' } });
    }
  },

  // ── Title ────────────────────────────────────────────────────────────────

  setTitle: (title: string) => {
    const { resume } = get();
    if (!resume) return;
    set({ resume: { ...resume, title } });
  },

  flushTitle: async () => {
    const { resume } = get();
    if (!resume?.title.trim()) return;
    set({ isSaving: true });
    try {
      await api.patch(`/resumes/${resume.id}`, { title: resume.title });
      set({ isSaving: false, message: { type: 'success', text: 'Title saved' } });
    } catch {
      set({ isSaving: false, message: { type: 'error', text: 'Failed to save title' } });
    }
  },

  // ── Resume actions ──────────────────────────────────────────────────────

  duplicateResume: async () => {
    const { resume } = get();
    if (!resume) return;
    try {
      const dup = await api.post<Resume>(`/resumes/${resume.id}/duplicate`, {});
      set({ message: { type: 'success', text: `Duplicated as "${dup.title}"` } });
    } catch {
      set({ message: { type: 'error', text: 'Failed to duplicate resume' } });
    }
  },

  archiveResume: async () => {
    const { resume } = get();
    if (!resume) return;
    try {
      await api.patch(`/resumes/${resume.id}`, { status: 'ARCHIVED' });
      set({
        resume: { ...resume, status: 'ARCHIVED' },
        message: { type: 'success', text: 'Resume archived' },
      });
    } catch {
      set({ message: { type: 'error', text: 'Failed to archive resume' } });
    }
  },

  createVersion: async (note?: string) => {
    const { resume, loadVersions } = get();
    if (!resume) return;
    try {
      await api.post(`/resumes/${resume.id}/versions`, { note });
      loadVersions(resume.id);
      set({ message: { type: 'success', text: 'Version created' } });
    } catch {
      set({ message: { type: 'error', text: 'Failed to create version' } });
    }
  },

  setMessage: (msg) => set({ message: msg }),

  reset: () => {
    pendingSaves.clear();
    saveTimers.forEach(clearTimeout);
    saveTimers.clear();
    set({
      resume: null,
      versions: [],
      isLoading: false,
      isSaving: false,
      savingSectionId: null,
      message: null,
    });
  },
}));

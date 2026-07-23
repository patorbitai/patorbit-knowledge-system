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
  lastSaved: Date | null;
  saveError: string | null;
  savingSectionId: string | null;
  message: ResumeMessage;

  setResume: (resume: Resume) => void;
  loadResume: (id: string) => Promise<void>;
  loadVersions: (id: string) => Promise<void>;
  updateSectionContent: (sectionId: string, content: Record<string, unknown>) => void;
  flushSection: (sectionId: string) => Promise<void>;
  toggleSection: (sectionId: string) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  addSection: (resumeId: string, type: string, title?: string) => Promise<void>;
  setTitle: (title: string) => void;
  flushTitle: () => Promise<void>;
  reorderSections: (sectionIds: string[]) => Promise<void>;
  duplicateResume: () => Promise<void>;
  archiveResume: () => Promise<void>;
  createVersion: (note?: string) => Promise<void>;
  setMessage: (msg: ResumeMessage) => void;
  reset: () => void;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const pendingSaves = new Map<string, Record<string, unknown>>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
let titleSaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(
  id: string,
  data: Record<string, unknown>,
  flushFn: (id: string) => void,
  isTitle = false,
) {
  const map = isTitle ? new Map([['title', data]]) : pendingSaves;
  const timerMap = isTitle ? new Map([['title', titleSaveTimer]]) : saveTimers;

  map.set(id, data);
  const existing = timerMap.get(id);
  if (existing) clearTimeout(existing);

  const newTimer = setTimeout(() => {
    map.delete(id);
    timerMap.delete(id);
    if (isTitle) titleSaveTimer = null;
    flushFn(id);
  }, 1200); // Increased debounce time

  if (isTitle) {
    titleSaveTimer = newTimer;
  } else {
    timerMap.set(id, newTimer);
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useResumeStore = create<ResumeStore>()((set, get) => ({
  resume: null,
  versions: [],
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  saveError: null,
  savingSectionId: null,
  message: null,

  // ── Setters ────────────────────────────────────────────────────────────────

  setResume: (resume) => {
    set({ resume });
  },

  // ── Loaders ──────────────────────────────────────────────────────────────

  loadResume: async (id: string) => {
    set({ isLoading: true, message: null, saveError: null });
    try {
      const data = await api.get<Resume>(`/resumes/${id}`);
      set({ resume: data, isLoading: false, lastSaved: new Date() });
    } catch {
      set({
        isLoading: false,
        message: { type: 'error', text: 'Failed to load resume' },
        saveError: 'Failed to load resume',
      });
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

    const section = resume.sections.find((s) => s.id === sectionId);
    if (!section?.content) return;

    set({ savingSectionId: sectionId, isSaving: true, saveError: null });
    try {
      await api.patch(`/resumes/${resume.id}/sections/${sectionId}`, { content: section.content });
      set({ lastSaved: new Date() });
    } catch (e) {
      const error = e as Error;
      set({
        saveError: `Failed to save section: ${error.message}`,
        message: { type: 'error', text: 'Failed to save section' },
      });
    } finally {
      set({ savingSectionId: null, isSaving: false });
    }
  },

  toggleSection: async (sectionId: string) => {
    const { resume } = get();
    if (!resume) return;

    const originalSections = resume.sections;
    const newSections = originalSections.map((s) =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s,
    );
    set({ resume: { ...resume, sections: newSections } });

    try {
      await api.patch(`/resumes/${resume.id}/sections/${sectionId}/toggle`, {});
    } catch {
      set({
        resume: { ...resume, sections: originalSections },
        message: { type: 'error', text: 'Failed to update section' },
      });
    }
  },

  deleteSection: async (sectionId: string) => {
    const { resume } = get();
    if (!resume) return;

    const originalSections = resume.sections;
    set({ resume: { ...resume, sections: resume.sections.filter((s) => s.id !== sectionId) } });

    try {
      await api.del(`/resumes/${resume.id}/sections/${sectionId}`);
      set({ message: { type: 'success', text: 'Section deleted' } });
    } catch {
      set({
        resume: { ...resume, sections: originalSections },
        message: { type: 'error', text: 'Failed to delete section' },
      });
    }
  },

  addSection: async (resumeId: string, type: string, title?: string) => {
    set({ isSaving: true });
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
    } finally {
      set({ isSaving: false });
    }
  },

  // ── Title ────────────────────────────────────────────────────────────────

  setTitle: (title: string) => {
    const { resume } = get();
    if (!resume) return;
    set({ resume: { ...resume, title } });
    // Schedule auto-save for title
    scheduleFlush('title', { title }, get().flushTitle, true);
  },

  flushTitle: async () => {
    const { resume } = get();
    if (!resume?.title.trim()) return;
    set({ isSaving: true, saveError: null });
    try {
      await api.patch(`/resumes/${resume.id}`, { title: resume.title });
      set({ lastSaved: new Date() });
    } catch (e) {
      const error = e as Error;
      set({
        saveError: `Failed to save title: ${error.message}`,
        message: { type: 'error', text: 'Failed to save title' },
      });
    } finally {
      set({ isSaving: false });
    }
  },

  // ── Section order ────────────────────────────────────────────────────────

  reorderSections: async (sectionIds: string[]) => {
    const { resume } = get();
    if (!resume) return;

    const originalSections = resume.sections;
    const reorderedSections = sectionIds
      .map((id) => originalSections.find((s) => s.id === id))
      .filter((s): s is ResumeSection => !!s)
      .map((s, i) => ({ ...s, sortOrder: i }));

    set({ resume: { ...resume, sections: reorderedSections } });

    try {
      await api.patch(`/resumes/${resume.id}/sections/reorder`, {
        sectionIds,
      });
    } catch {
      set({
        resume: { ...resume, sections: originalSections },
        message: { type: 'error', text: 'Failed to reorder sections' },
      });
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
    if (titleSaveTimer) clearTimeout(titleSaveTimer);
    titleSaveTimer = null;
    set({
      resume: null,
      versions: [],
      isLoading: false,
      isSaving: false,
      lastSaved: null,
      saveError: null,
      savingSectionId: null,
      message: null,
    });
  },
}));

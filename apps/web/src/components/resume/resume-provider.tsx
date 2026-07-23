'use client';

import { createContext, useContext } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';
import { type Resume } from '@/lib/types';

// ── Context for sharing state across resume sub-components ───────────────────

interface ResumeEditorContextValue {
  resumeId: string;
  resume: Resume;
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
}

const ResumeEditorContext = createContext<ResumeEditorContextValue | null>(null);

export function ResumeProvider({
  resumeId,
  children,
}: {
  resumeId: string;
  children: React.ReactNode;
}) {
  const resume = useResumeStore((s) => s.resume);
  const isSaving = useResumeStore((s) => s.isSaving);
  const lastSaved = useResumeStore((s) => s.lastSaved);
  const saveError = useResumeStore((s) => s.saveError);

  if (!resume) return null;

  return (
    <ResumeEditorContext.Provider value={{ resumeId, resume, isSaving, lastSaved, saveError }}>
      {children}
    </ResumeEditorContext.Provider>
  );
}

export function useResumeEditor() {
  const ctx = useContext(ResumeEditorContext);
  if (!ctx) {
    throw new Error('useResumeEditor must be used within ResumeProvider');
  }
  return ctx;
}

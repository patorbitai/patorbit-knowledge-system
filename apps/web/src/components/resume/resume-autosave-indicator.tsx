'use client';

import { useResumeStore } from '@/lib/stores/use-resume-store';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ResumeAutosaveIndicator() {
  const isSaving = useResumeStore((s) => s.isSaving);
  const lastSaved = useResumeStore((s) => s.lastSaved);
  const saveError = useResumeStore((s) => s.saveError);

  if (isSaving) {
    return <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>;
  }

  if (saveError) {
    return <span className="text-xs text-red-500">Save failed</span>;
  }

  if (lastSaved) {
    return <span className="text-xs text-muted-foreground">Saved at {formatTime(lastSaved)}</span>;
  }

  return null;
}

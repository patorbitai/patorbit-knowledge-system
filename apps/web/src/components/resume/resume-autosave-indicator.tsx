'use client';

import { useResumeStore } from '@/lib/stores/use-resume-store';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type SyncStatus = ReturnType<typeof useResumeStore.getState>['syncStatus'];

const cfg: Record<SyncStatus, { text: string; cls: string } | null> = {
  idle: null,
  saving: { text: 'Saving…', cls: 'text-muted-foreground animate-pulse' },
  saved: { text: 'Saved', cls: 'text-muted-foreground' },
  error: { text: 'Save failed', cls: 'text-red-500' },
  'pending-sync': { text: 'Pending Sync', cls: 'text-amber-500' },
  offline: { text: 'Offline', cls: 'text-muted-foreground' },
  retrying: { text: 'Retrying…', cls: 'text-amber-500 animate-pulse' },
};

export function ResumeAutosaveIndicator() {
  const syncStatus = useResumeStore((s) => s.syncStatus);
  const lastSaved = useResumeStore((s) => s.lastSaved);

  if (syncStatus === 'saved' && lastSaved) {
    return (
      <div role="status" aria-live="polite" aria-atomic="true">
        <span className="text-xs text-muted-foreground">Saved at {formatTime(lastSaved)}</span>
      </div>
    );
  }

  const c = cfg[syncStatus];
  if (!c) return null;

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <span className={`text-xs ${c.cls}`}>{c.text}</span>
    </div>
  );
}

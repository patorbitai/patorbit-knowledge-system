// apps/web/src/components/resume/resume-header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { statusColor, timeAgo } from '@/lib/resume-utils';
import { useResumeStore } from '@/lib/stores/use-resume-store';

import { ResumeAutosaveIndicator } from './resume-autosave-indicator';
import { ResumeAutosaveIndicator } from './resume-autosave-indicator';

export function ResumeHeader() {
  const resume = useResumeStore((s) => s.resume);
  const versions = useResumeStore((s) => s.versions);
  const title = useResumeStore((s) => s.resume?.title ?? '');
  const setTitle = useResumeStore((s) => s.setTitle);
  const flushTitle = useResumeStore((s) => s.flushTitle);
  const createVersion = useResumeStore((s) => s.createVersion);
  const duplicateResume = useResumeStore((s) => s.duplicateResume);
  const archiveResume = useResumeStore((s) => s.archiveResume);
  const loadVersions = useResumeStore((s) => s.loadVersions);

  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (showVersions && resume) {
      loadVersions(resume.id);
    }
  }, [showVersions, resume, loadVersions]);

  if (!resume) return null;

  const hiddenSectionCount = resume.sections.filter((s) => !s.isVisible).length;

  return (
    <div className="p-6 border-b">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/resumes" className="hover:text-foreground">
          Resumes
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{resume.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={flushTitle}
              className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${statusColor(resume.status)}`}
            >
              {resume.status.toLowerCase()}
            </span>
            <span className="text-xs text-muted-foreground">v{resume.version}</span>
            {hiddenSectionCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {hiddenSectionCount} hidden section{hiddenSectionCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ResumeAutosaveIndicator />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="px-3 py-1.5 text-sm border rounded hover:bg-accent"
            >
              {showVersions ? 'Hide' : 'Versions'}
            </button>
            <button
              onClick={duplicateResume}
              className="px-3 py-1.5 text-sm border rounded hover:bg-accent"
            >
              Duplicate
            </button>
            {resume.status !== 'ARCHIVED' && (
              <button
                onClick={archiveResume}
                className="px-3 py-1.5 text-sm border rounded hover:bg-accent text-red-500"
              >
                Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Versions Panel */}
      {showVersions && (
        <div className="mt-4 border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Versions</h3>
            <button
              onClick={() => createVersion()}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
            >
              + Snapshot
            </button>
          </div>
          {versions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No versions yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm py-1">
                  <span>
                    v{v.version}{' '}
                    {v.note && <span className="text-muted-foreground">&mdash; {v.note}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(v.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

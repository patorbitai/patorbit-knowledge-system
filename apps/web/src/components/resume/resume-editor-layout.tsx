'use client';

import { useCallback, useEffect, useState } from 'react';

import { useWarnOnUnsavedChanges } from '@/lib/hooks/use-warn-unsaved';
import { useResumeStore } from '@/lib/stores/use-resume-store';
import { cn } from '@/lib/utils';

import { ResumeEditor } from './resume-editor';
import { ResumePreview } from './resume-preview';
import { ResumeSectionNav, type SectionNavItem } from './resume-section-nav';

export interface ResumeEditorLayoutProps {
  resumeId: string;
}

export function ResumeEditorLayout({ resumeId }: ResumeEditorLayoutProps) {
  const resume = useResumeStore((s) => s.resume);
  const savingSectionId = useResumeStore((s) => s.savingSectionId);
  const addSection = useResumeStore((s) => s.addSection);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const { selectedSectionId: activeSectionId } = useResumeStore((s) => s.ui);
  const setSelectedSection = useResumeStore((s) => s.setSelectedSection);
  const openAddSectionModal = useResumeStore((s) => s.openAddSectionModal);
  const [showNav, setShowNav] = useState(false);

  useWarnOnUnsavedChanges(true);

  // Auto-select first section if none is selected
  useEffect(() => {
    if (resume?.sections && resume.sections.length > 0 && !activeSectionId) {
      setSelectedSection(resume.sections[0].id);
    }
  }, [resume?.sections, activeSectionId, setSelectedSection]);

  const handleAddSection = useCallback(
    (type: string, title?: string) => {
      addSection(resumeId, type, title);
    },
    [addSection, resumeId],
  );

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      setSelectedSection(sectionId);
      // Scroll to the section in the editor
      const el = document.getElementById(`section-${sectionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [setSelectedSection],
  );

  const handleToggleVisibility = useCallback(
    (sectionId: string) => {
      toggleSection(sectionId);
    },
    [toggleSection],
  );

  if (!resume) return null;

  const sectionNavItems = useMemo(
    (): SectionNavItem[] =>
      resume.sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        isVisible: s.isVisible,
        hasContent: s.content !== null && Object.keys(s.content).length > 0,
        isSaving: savingSectionId === s.id,
      })),
    [resume.sections, savingSectionId],
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Mobile nav toggle */}
      <button
        type="button"
        onClick={() => setShowNav(!showNav)}
        aria-expanded={showNav}
        aria-controls="resume-section-nav"
        aria-label={showNav ? 'Close section navigation' : 'Open section navigation'}
        className="fixed bottom-4 left-4 z-50 md:hidden bg-primary text-primary-foreground px-3 py-2 rounded-full shadow-lg text-sm"
      >
        <span aria-hidden="true">{showNav ? '✕' : '☰'}</span>
      </button>

      {/* Left: Section Navigation */}
      <aside
        id="resume-section-nav"
        className={cn(
          'w-64 shrink-0 border-r bg-card overflow-y-auto',
          // Mobile: overlay
          'fixed inset-y-0 left-0 z-40 transition-transform md:relative md:translate-x-0',
          showNav ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <ResumeSectionNav
          sections={sectionNavItems}
          activeSectionId={activeSectionId}
          onSectionClick={handleSectionClick}
          onToggleVisibility={handleToggleVisibility}
          onAddClick={() => {
            setShowNav(false);
            openAddSectionModal();
          }}
        />
      </aside>

      {/* Mobile backdrop */}
      {showNav && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setShowNav(false)}
        />
      )}

      {/* Center: Editor Panel */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
          <ResumeEditor resumeId={resumeId} onAddSection={handleAddSection} />
        </div>
      </div>

      {/* Right: Live Preview */}
      <aside className="hidden lg:block lg:w-96 xl:w-[420px] shrink-0 border-l bg-muted/30">
        <div className="h-full">
          <ResumePreview />
        </div>
      </aside>
    </div>
  );
}

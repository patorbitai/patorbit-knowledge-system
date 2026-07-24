'use client';

import { memo } from 'react';

import { cn } from '@/lib/utils';

// ── Section type metadata (shared with resume-editor.tsx) ─────────────────
import { SECTION_ICONS, SECTION_LABELS } from './section-constants';

// ── Types ───────────────────────────────────────────────────────────────────

export interface SectionNavItem {
  id: string;
  type: string;
  title: string | null;
  isVisible: boolean;
  hasContent: boolean;
  isSaving: boolean;
}

export interface ResumeSectionNavProps {
  sections: SectionNavItem[];
  activeSectionId: string | null;
  onSectionClick: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddClick: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isSectionEmpty(section: SectionNavItem): boolean {
  return !section.hasContent;
}

// ── Component ───────────────────────────────────────────────────────────────

export const ResumeSectionNav = memo(function ResumeSectionNav({
  sections,
  activeSectionId,
  onSectionClick,
  onToggleVisibility,
  onAddClick,
}: ResumeSectionNavProps) {
  const visibleCount = sections.filter((s) => s.isVisible).length;
  const hiddenCount = sections.length - visibleCount;

  return (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Sections</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sections.length} total
          {hiddenCount > 0 && ` (${hiddenCount} hidden)`}
        </p>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No sections yet.</div>
        ) : (
          <ul className="py-2 space-y-0.5" role="list">
            {sections.map((section) => {
              const isActive = section.id === activeSectionId;
              const empty = isSectionEmpty(section);

              return (
                <li key={section.id}>
                  <div
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-left text-sm',
                      !section.isVisible && 'opacity-50',
                    )}
                  >
                    {/* Status dot */}
                    <span
                      className={cn(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        section.isSaving
                          ? 'bg-amber-400 animate-pulse'
                          : empty
                            ? 'bg-muted-foreground/30'
                            : 'bg-emerald-500',
                      )}
                    />
                    <span className="sr-only">
                      {section.isSaving ? 'Saving...' : empty ? 'No content' : 'Has content'}
                    </span>

                    {/* Icon */}
                    <span className="shrink-0 text-base leading-none">
                      {SECTION_ICONS[section.type] ?? '📄'}
                    </span>

                    {/* Label */}
                    <button
                      type="button"
                      onClick={() => onSectionClick(section.id)}
                      className={cn(
                        'truncate flex-1 text-left transition-colors',
                        isActive
                          ? 'text-accent-foreground font-medium'
                          : 'hover:text-accent-foreground',
                      )}
                    >
                      {section.title ?? SECTION_LABELS[section.type] ?? section.type}
                    </button>

                    {/* Visibility toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(section.id);
                      }}
                      aria-label={
                        section.isVisible
                          ? `Hide ${section.title ?? 'section'}`
                          : `Show ${section.title ?? 'section'}`
                      }
                      className={cn(
                        'shrink-0 text-xs px-1 py-0.5 rounded hover:bg-background transition-colors',
                        section.isVisible ? 'text-muted-foreground' : 'text-muted-foreground/50',
                      )}
                    >
                      <span aria-hidden="true">{section.isVisible ? '👁️' : '🚫'}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add section button */}
      <div className="px-3 py-3 border-t">
        <button
          type="button"
          onClick={onAddClick}
          className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          + Add Section
        </button>
      </div>
    </nav>
  );
});

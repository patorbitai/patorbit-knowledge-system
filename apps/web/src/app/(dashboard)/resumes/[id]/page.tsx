'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';

// ── Types ───────────────────────────────────────────────────────────────────

type ResumeSection = {
  id: string;
  type: string;
  title: string | null;
  sortOrder: number;
  isVisible: boolean;
  isCollapsible: boolean;
  isCollapsed: boolean;
  content: Record<string, unknown> | null;
  version: number;
};

type Resume = {
  id: string;
  title: string;
  status: string;
  templateId: string | null;
  version: number;
  sections: ResumeSection[];
};

type ResumeVersion = {
  id: string;
  version: number;
  note: string | null;
  createdAt: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, string> = {
  PERSONAL_INFORMATION: '👤',
  PROFESSIONAL_SUMMARY: '📝',
  WORK_EXPERIENCE: '💼',
  EDUCATION: '🎓',
  PROJECTS: '🚀',
  SKILLS: '⚡',
  CERTIFICATIONS: '🏅',
  ACHIEVEMENTS: '🏆',
  LANGUAGES: '🌐',
  VOLUNTEER_EXPERIENCE: '🤝',
  PUBLICATIONS: '📚',
  AWARDS: '🎖️',
  INTERESTS: '🎯',
  CUSTOM: '📌',
};

const SECTION_LABELS: Record<string, string> = {
  PERSONAL_INFORMATION: 'Personal Information',
  PROFESSIONAL_SUMMARY: 'Professional Summary',
  WORK_EXPERIENCE: 'Work Experience',
  EDUCATION: 'Education',
  PROJECTS: 'Projects',
  SKILLS: 'Skills',
  CERTIFICATIONS: 'Certifications',
  ACHIEVEMENTS: 'Achievements',
  LANGUAGES: 'Languages',
  VOLUNTEER_EXPERIENCE: 'Volunteer Experience',
  PUBLICATIONS: 'Publications',
  AWARDS: 'Awards',
  INTERESTS: 'Interests',
  CUSTOM: 'Custom',
};

const AVAILABLE_SECTION_TYPES = Object.keys(SECTION_LABELS);

function statusColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'ACTIVE':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'ARCHIVED':
      return 'text-gray-500 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function ResumeSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="space-y-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section content editor ──────────────────────────────────────────────────

function SectionEditor({
  section,
  onUpdate,
}: {
  section: ResumeSection;
  onUpdate: (id: string, content: Record<string, unknown>) => void;
}) {
  const content = section.content ?? {};
  const type = section.type;

  const setField = (key: string, value: unknown) => {
    onUpdate(section.id, { ...content, [key]: value });
  };

  // Render different form fields based on section type
  switch (type) {
    case 'PERSONAL_INFORMATION':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={(content.fullName as string) ?? ''}
              onChange={(e) => setField('fullName', e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              type="email"
              value={(content.email as string) ?? ''}
              onChange={(e) => setField('email', e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Phone</label>
            <input
              type="text"
              value={(content.phone as string) ?? ''}
              onChange={(e) => setField('phone', e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Location</label>
            <input
              type="text"
              value={(content.location as string) ?? ''}
              onChange={(e) => setField('location', e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={(content.linkedinUrl as string) ?? ''}
              onChange={(e) => setField('linkedinUrl', e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1">Website / Portfolio</label>
            <input
              type="url"
              value={(content.website as string) ?? ''}
              onChange={(e) => setField('website', e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            />
          </div>
        </div>
      );

    case 'PROFESSIONAL_SUMMARY':
      return (
        <div>
          <label className="block text-xs font-medium mb-1">Summary</label>
          <textarea
            rows={4}
            value={(content.summary as string) ?? ''}
            onChange={(e) => setField('summary', e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm bg-background resize-y"
            placeholder="Write a brief professional summary..."
          />
        </div>
      );

    case 'WORK_EXPERIENCE':
    case 'VOLUNTEER_EXPERIENCE': {
      const entries = (content.entries as Array<Record<string, unknown>>) ?? [];
      return (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div key={i} className="p-3 border rounded bg-gray-50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={(entry.company as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], company: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Company"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  value={(entry.title as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], title: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Job Title"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={(entry.startDate as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], startDate: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Start Date (e.g. Jan 2020)"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  value={(entry.endDate as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], endDate: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="End Date (or 'Present')"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
              </div>
              <textarea
                rows={2}
                value={(entry.description as string) ?? ''}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], description: e.target.value };
                  setField('entries', updated);
                }}
                placeholder="Describe your role and achievements..."
                className="w-full border rounded px-2 py-1.5 text-sm bg-white resize-y"
              />
              <button
                onClick={() => {
                  const updated = entries.filter((_, j) => j !== i);
                  setField('entries', updated);
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setField('entries', [
                ...entries,
                { company: '', title: '', startDate: '', endDate: '', description: '' },
              ])
            }
            className="text-sm text-primary hover:underline"
          >
            + Add Entry
          </button>
        </div>
      );
    }

    case 'EDUCATION': {
      const entries = (content.entries as Array<Record<string, unknown>>) ?? [];
      return (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div key={i} className="p-3 border rounded bg-gray-50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={(entry.institution as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], institution: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Institution"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  value={(entry.degree as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], degree: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Degree"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={(entry.startDate as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], startDate: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Start Date"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  value={(entry.endDate as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], endDate: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="End Date"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
              </div>
              <textarea
                rows={2}
                value={(entry.description as string) ?? ''}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], description: e.target.value };
                  setField('entries', updated);
                }}
                placeholder="Details, honors, activities..."
                className="w-full border rounded px-2 py-1.5 text-sm bg-white resize-y"
              />
              <button
                onClick={() => {
                  const updated = entries.filter((_, j) => j !== i);
                  setField('entries', updated);
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setField('entries', [
                ...entries,
                { institution: '', degree: '', startDate: '', endDate: '', description: '' },
              ])
            }
            className="text-sm text-primary hover:underline"
          >
            + Add Entry
          </button>
        </div>
      );
    }

    case 'SKILLS': {
      const items = (content.items as string[]) ?? [];
      return (
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {items.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded"
              >
                {item}
                <button
                  onClick={() =>
                    setField(
                      'items',
                      items.filter((_, j) => j !== i),
                    )
                  }
                  className="text-xs hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a skill..."
              className="flex-1 border rounded px-2 py-1.5 text-sm bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value && !items.includes(value)) {
                    setField('items', [...items, value]);
                  }
                  input.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                const value = input?.value?.trim();
                if (value && !items.includes(value)) {
                  setField('items', [...items, value]);
                }
                if (input) input.value = '';
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded"
            >
              Add
            </button>
          </div>
        </div>
      );
    }

    case 'CERTIFICATIONS':
    case 'ACHIEVEMENTS':
    case 'PUBLICATIONS':
    case 'AWARDS': {
      const entries = (content.entries as Array<Record<string, unknown>>) ?? [];
      const label =
        type === 'CERTIFICATIONS'
          ? 'Certification'
          : type === 'ACHIEVEMENTS'
            ? 'Achievement'
            : type === 'PUBLICATIONS'
              ? 'Publication'
              : 'Award';
      return (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={i} className="p-3 border rounded bg-gray-50 space-y-2">
              <input
                type="text"
                value={(entry.name as string) ?? ''}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setField('entries', updated);
                }}
                placeholder={label + ' Name'}
                className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={(entry.issuer as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], issuer: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Issuer / Organization"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
                <input
                  type="text"
                  value={(entry.date as string) ?? ''}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[i] = { ...updated[i], date: e.target.value };
                    setField('entries', updated);
                  }}
                  placeholder="Date"
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
              </div>
              <button
                onClick={() => {
                  const updated = entries.filter((_, j) => j !== i);
                  setField('entries', updated);
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => setField('entries', [...entries, { name: '', issuer: '', date: '' }])}
            className="text-sm text-primary hover:underline"
          >
            + Add {label}
          </button>
        </div>
      );
    }

    case 'PROJECTS': {
      const entries = (content.entries as Array<Record<string, unknown>>) ?? [];
      return (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div key={i} className="p-3 border rounded bg-gray-50 space-y-2">
              <input
                type="text"
                value={(entry.name as string) ?? ''}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setField('entries', updated);
                }}
                placeholder="Project Name"
                className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              />
              <textarea
                rows={2}
                value={(entry.description as string) ?? ''}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], description: e.target.value };
                  setField('entries', updated);
                }}
                placeholder="Describe the project..."
                className="w-full border rounded px-2 py-1.5 text-sm bg-white resize-y"
              />
              <input
                type="url"
                value={(entry.url as string) ?? ''}
                onChange={(e) => {
                  const updated = [...entries];
                  updated[i] = { ...updated[i], url: e.target.value };
                  setField('entries', updated);
                }}
                placeholder="Project URL (optional)"
                className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              />
              <button
                onClick={() => {
                  const updated = entries.filter((_, j) => j !== i);
                  setField('entries', updated);
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setField('entries', [...entries, { name: '', description: '', url: '' }])
            }
            className="text-sm text-primary hover:underline"
          >
            + Add Project
          </button>
        </div>
      );
    }

    case 'LANGUAGES': {
      const items = (content.items as Array<Record<string, string>>) ?? [];
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={item.language ?? ''}
                onChange={(e) => {
                  const updated = [...items];
                  updated[i] = { ...updated[i], language: e.target.value };
                  setField('items', updated);
                }}
                placeholder="Language"
                className="flex-1 border rounded px-2 py-1.5 text-sm bg-white"
              />
              <input
                type="text"
                value={item.proficiency ?? ''}
                onChange={(e) => {
                  const updated = [...items];
                  updated[i] = { ...updated[i], proficiency: e.target.value };
                  setField('items', updated);
                }}
                placeholder="Proficiency"
                className="w-32 border rounded px-2 py-1.5 text-sm bg-white"
              />
              <button
                onClick={() =>
                  setField(
                    'items',
                    items.filter((_, j) => j !== i),
                  )
                }
                className="text-xs text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setField('items', [...items, { language: '', proficiency: '' }])}
            className="text-sm text-primary hover:underline"
          >
            + Add Language
          </button>
        </div>
      );
    }

    case 'INTERESTS': {
      const items = (content.items as string[]) ?? [];
      return (
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {items.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-sm rounded"
              >
                {item}
                <button
                  onClick={() =>
                    setField(
                      'items',
                      items.filter((_, j) => j !== i),
                    )
                  }
                  className="text-xs hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add an interest..."
              className="flex-1 border rounded px-2 py-1.5 text-sm bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const value = input.value.trim();
                  if (value && !items.includes(value)) {
                    setField('items', [...items, value]);
                  }
                  input.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                const value = input?.value?.trim();
                if (value && !items.includes(value)) {
                  setField('items', [...items, value]);
                }
                if (input) input.value = '';
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded"
            >
              Add
            </button>
          </div>
        </div>
      );
    }

    // CUSTOM and fallback
    default:
      return (
        <textarea
          rows={4}
          value={JSON.stringify(content, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onUpdate(section.id, parsed);
            } catch {
              // Allow incomplete JSON editing
            }
          }}
          className="w-full border rounded px-2 py-1.5 text-sm font-mono bg-background resize-y"
        />
      );
  }
}

// ── Section card ────────────────────────────────────────────────────────────

function SectionCard({
  section,
  onUpdate,
  onToggle,
  onDelete,
  saving,
}: {
  section: ResumeSection;
  onUpdate: (id: string, content: Record<string, unknown>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(!section.isCollapsed);

  return (
    <div
      className={`border rounded-lg bg-card transition-opacity ${
        !section.isVisible ? 'opacity-50' : ''
      }`}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => section.isCollapsible && setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{SECTION_ICONS[section.type] ?? '📄'}</span>
          <div>
            <h3 className="font-medium text-sm">
              {section.title ?? SECTION_LABELS[section.type] ?? section.type}
            </h3>
            <p className="text-xs text-muted-foreground">
              {section.type.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(section.id);
            }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
            title={section.isVisible ? 'Hide section' : 'Show section'}
          >
            {section.isVisible ? '👁️' : '🚫'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(section.id);
            }}
            className="text-xs text-muted-foreground hover:text-red-500 px-2 py-1 rounded hover:bg-accent"
            title="Delete section"
          >
            🗑️
          </button>
          {section.isCollapsible && (
            <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
          )}
        </div>
      </div>
      {open && section.isVisible && (
        <div className="px-4 pb-4 border-t pt-3">
          <SectionEditor section={section} onUpdate={onUpdate} />
          {saving && <p className="text-xs text-muted-foreground mt-2">Saving...</p>}
        </div>
      )}
    </div>
  );
}

// ── Add section modal ───────────────────────────────────────────────────────

function AddSectionModal({
  open,
  onClose,
  onAdd,
  existingTypes,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: string, title?: string) => void;
  existingTypes: string[];
}) {
  const [selected, setSelected] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  if (!open) return null;

  const available = AVAILABLE_SECTION_TYPES.filter(
    (t) => !existingTypes.includes(t) || t === 'CUSTOM',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="font-semibold mb-4">Add Section</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {available.map((type) => (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-3 ${
                selected === type ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
              }`}
            >
              <span>{SECTION_ICONS[type] ?? '📄'}</span>
              <span>{SECTION_LABELS[type] ?? type}</span>
            </button>
          ))}
        </div>
        {selected === 'CUSTOM' && (
          <div className="mt-3">
            <label className="block text-xs font-medium mb-1">Section Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Technical Skills"
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={() => {
              if (selected) {
                onAdd(selected, customTitle || undefined);
              }
            }}
            disabled={!selected}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function ResumeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchResume = useCallback(async () => {
    try {
      const data = await api.get<Resume>(`/resumes/${id}`);
      setResume(data);
      setTitle(data.title);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load resume' });
    }
  }, [id]);

  const fetchVersions = useCallback(async () => {
    try {
      const data = await api.get<ResumeVersion[]>(`/resumes/${id}/versions`);
      setVersions(data);
    } catch {
      // silent
    }
  }, [id]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  // ── Update section content ──────────────────────────────────────────────
  const updateSectionContent = useCallback(
    async (sectionId: string, content: Record<string, unknown>) => {
      setSaving(true);
      try {
        await api.patch(`/resumes/${id}/sections/${sectionId}`, { content });
        // Optimistically update local state
        setResume((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === sectionId ? { ...s, content, version: s.version + 1 } : s,
            ),
          };
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to save section' });
      } finally {
        setSaving(false);
      }
    },
    [id],
  );

  // ── Toggle section visibility ───────────────────────────────────────────
  const toggleSection = useCallback(
    async (sectionId: string) => {
      try {
        await api.patch(`/resumes/${id}/sections/${sectionId}/toggle`, {});
        setResume((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s,
            ),
          };
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to update section' });
      }
    },
    [id],
  );

  // ── Delete section ──────────────────────────────────────────────────────
  const deleteSection = useCallback(
    async (sectionId: string) => {
      try {
        await api.del(`/resumes/${id}/sections/${sectionId}`);
        setResume((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.filter((s) => s.id !== sectionId),
          };
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to delete section' });
      }
    },
    [id],
  );

  // ── Add section ─────────────────────────────────────────────────────────
  const addSection = useCallback(
    async (type: string, title?: string) => {
      try {
        const created = await api.post<ResumeSection>(`/resumes/${id}/sections`, {
          type,
          ...(title && { title }),
        });
        setResume((prev) => {
          if (!prev) return prev;
          return { ...prev, sections: [...prev.sections, created] };
        });
        setShowAddModal(false);
        setMessage({ type: 'success', text: 'Section added' });
      } catch {
        setMessage({ type: 'error', text: 'Failed to add section' });
      }
    },
    [id],
  );

  // ── Save title ──────────────────────────────────────────────────────────
  const saveTitle = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/resumes/${id}`, { title });
      setMessage({ type: 'success', text: 'Title saved' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save title' });
    } finally {
      setSaving(false);
    }
  }, [id, title]);

  // ── Duplicate ───────────────────────────────────────────────────────────
  const duplicateResume = useCallback(async () => {
    try {
      const dup = await api.post<Resume>(`/resumes/${id}/duplicate`, {});
      setMessage({ type: 'success', text: `Duplicated as "${dup.title}"` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to duplicate resume' });
    }
  }, [id]);

  // ── Archive ─────────────────────────────────────────────────────────────
  const archiveResume = useCallback(async () => {
    try {
      await api.post(`/resumes/${id}/archive`, {});
      fetchResume();
      setMessage({ type: 'success', text: 'Resume archived' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to archive resume' });
    }
  }, [id, fetchResume]);

  // ── Create version ──────────────────────────────────────────────────────
  const createVersion = useCallback(async () => {
    try {
      await api.post(`/resumes/${id}/versions`, {});
      fetchVersions();
      setMessage({ type: 'success', text: 'Version created' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to create version' });
    }
  }, [id, fetchVersions]);

  if (!resume) return <ResumeSkeleton />;

  const visibleSections = resume.sections.filter((s) => !s.isCollapsed);
  const hiddenSectionCount = resume.sections.filter((s) => !s.isVisible).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/resumes" className="hover:text-foreground">
          Resumes
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{resume.title}</span>
      </div>

      {/* ── Flash messages ──────────────────────────────── */}
      {message && (
        <div
          className={`p-3 rounded text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
          onClick={() => setMessage(null)}
        >
          {message.text}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowVersions(!showVersions);
              if (!showVersions) fetchVersions();
            }}
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

      {/* ── Versions panel ──────────────────────────────── */}
      {showVersions && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Versions</h3>
            <button
              onClick={createVersion}
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

      {/* ── Sections ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sections ({resume.sections.length})</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            + Add Section
          </button>
        </div>

        {resume.sections.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No sections yet. Click &quot;Add Section&quot; to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {resume.sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onUpdate={updateSectionContent}
                onToggle={toggleSection}
                onDelete={deleteSection}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add section modal ───────────────────────────── */}
      <AddSectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addSection}
        existingTypes={resume.sections.map((s) => s.type)}
      />
    </div>
  );
}

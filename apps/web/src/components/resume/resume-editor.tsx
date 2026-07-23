// apps/web/src/components/resume/resume-editor.tsx
'use client';

import { useState } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';
import { type ResumeSection } from '@/lib/types';

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Section content editor ───────────────────────────────────────────────────

function PersonalInfoEditor({
  content,
  onUpdate,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const setField = (key: string, value: unknown) => onUpdate({ ...content, [key]: value });

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
}

function SummaryEditor({
  content,
  onUpdate,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">Summary</label>
      <textarea
        rows={4}
        value={(content.summary as string) ?? ''}
        onChange={(e) => onUpdate({ ...content, summary: e.target.value })}
        className="w-full border rounded px-2 py-1.5 text-sm bg-background resize-y"
        placeholder="Write a brief professional summary..."
      />
    </div>
  );
}

interface EntryEditorProps {
  entries: Array<Record<string, unknown>>;
  fields: Array<{ key: string; placeholder: string; colSpan?: boolean }>;
  textareaKey?: string;
  textareaPlaceholder?: string;
  defaultEntry: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
  content: Record<string, unknown>;
}

function EntryListEditor({
  entries,
  fields,
  textareaKey,
  textareaPlaceholder,
  defaultEntry,
  onUpdate,
  content,
}: EntryEditorProps) {
  const updateEntry = (index: number, updates: Record<string, unknown>) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({ ...content, entries: updated });
  };

  const removeEntry = (index: number) => {
    onUpdate({ ...content, entries: entries.filter((_, j) => j !== index) });
  };

  const addEntry = () => {
    onUpdate({ ...content, entries: [...entries, defaultEntry] });
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="p-3 border rounded bg-gray-50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {fields.map((field) => (
              <input
                key={field.key}
                type="text"
                value={(entry[field.key] as string) ?? ''}
                onChange={(e) => updateEntry(i, { [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className={`w-full border rounded px-2 py-1.5 text-sm bg-white ${field.colSpan ? 'col-span-2' : ''}`}
              />
            ))}
          </div>
          {textareaKey && (
            <textarea
              rows={2}
              value={(entry[textareaKey] as string) ?? ''}
              onChange={(e) => updateEntry(i, { [textareaKey]: e.target.value })}
              placeholder={textareaPlaceholder}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white resize-y"
            />
          )}
          <button
            onClick={() => removeEntry(i)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button onClick={addEntry} className="text-sm text-primary hover:underline">
        + Add Entry
      </button>
    </div>
  );
}

function SkillsEditor({
  content,
  onUpdate,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const items = (content.items as string[]) ?? [];

  const addItem = (value: string) => {
    if (value && !items.includes(value)) {
      onUpdate({ ...content, items: [...items, value] });
    }
  };

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
              onClick={() => onUpdate({ ...content, items: items.filter((_, j) => j !== i) })}
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
              addItem(input.value.trim());
              input.value = '';
            }
          }}
        />
        <button
          onClick={(e) => {
            const input =
              ((e.currentTarget as HTMLElement).parentElement
                ?.previousElementSibling as HTMLInputElement) ??
              ((e.currentTarget as HTMLElement).previousElementSibling as HTMLInputElement);
            const value = input?.value?.trim();
            addItem(value);
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

function LanguagesEditor({
  content,
  onUpdate,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
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
              onUpdate({ ...content, items: updated });
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
              onUpdate({ ...content, items: updated });
            }}
            placeholder="Proficiency"
            className="w-32 border rounded px-2 py-1.5 text-sm bg-white"
          />
          <button
            onClick={() => onUpdate({ ...content, items: items.filter((_, j) => j !== i) })}
            className="text-xs text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          onUpdate({ ...content, items: [...items, { language: '', proficiency: '' }] })
        }
        className="text-sm text-primary hover:underline"
      >
        + Add Language
      </button>
    </div>
  );
}

function TagsEditor({
  content,
  onUpdate,
  placeholder,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
  placeholder: string;
}) {
  const items = (content.items as string[]) ?? [];

  const addItem = (value: string) => {
    if (value && !items.includes(value)) {
      onUpdate({ ...content, items: [...items, value] });
    }
  };

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
              onClick={() => onUpdate({ ...content, items: items.filter((_, j) => j !== i) })}
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
          placeholder={placeholder}
          className="flex-1 border rounded px-2 py-1.5 text-sm bg-background"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const input = e.currentTarget;
              addItem(input.value.trim());
              input.value = '';
            }
          }}
        />
        <button
          onClick={(e) => {
            const input = (e.currentTarget as HTMLElement)
              .previousElementSibling as HTMLInputElement;
            const value = input?.value?.trim();
            addItem(value);
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

function CustomEditor({
  content,
  onUpdate,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const [manualEdit, setManualEdit] = useState(JSON.stringify(content, null, 2));

  return (
    <textarea
      rows={4}
      value={manualEdit}
      onChange={(e) => {
        setManualEdit(e.target.value);
        try {
          const parsed = JSON.parse(e.target.value);
          onUpdate(parsed);
        } catch {
          // Allow incomplete JSON while editing
        }
      }}
      className="w-full border rounded px-2 py-1.5 text-sm font-mono bg-background resize-y"
    />
  );
}

// ── Section Editor Router ────────────────────────────────────────────────────

function SectionEditor({
  section,
  onUpdate,
}: {
  section: ResumeSection;
  onUpdate: (id: string, content: Record<string, unknown>) => void;
}) {
  const content = section.content ?? {};
  const type = section.type;

  const handleUpdate = (newContent: Record<string, unknown>) => {
    onUpdate(section.id, newContent);
  };

  switch (type) {
    case 'PERSONAL_INFORMATION':
      return <PersonalInfoEditor content={content} onUpdate={handleUpdate} />;
    case 'PROFESSIONAL_SUMMARY':
      return <SummaryEditor content={content} onUpdate={handleUpdate} />;
    case 'WORK_EXPERIENCE':
    case 'VOLUNTEER_EXPERIENCE':
      return (
        <EntryListEditor
          content={content}
          entries={(content.entries as Array<Record<string, unknown>>) ?? []}
          fields={[
            { key: 'company', placeholder: 'Company' },
            { key: 'title', placeholder: 'Job Title' },
            { key: 'startDate', placeholder: 'Start Date (e.g. Jan 2020)' },
            { key: 'endDate', placeholder: "End Date (or 'Present')" },
          ]}
          textareaKey="description"
          textareaPlaceholder="Describe your role and achievements..."
          defaultEntry={{ company: '', title: '', startDate: '', endDate: '', description: '' }}
          onUpdate={handleUpdate}
        />
      );
    case 'EDUCATION':
      return (
        <EntryListEditor
          content={content}
          entries={(content.entries as Array<Record<string, unknown>>) ?? []}
          fields={[
            { key: 'institution', placeholder: 'Institution' },
            { key: 'degree', placeholder: 'Degree' },
            { key: 'startDate', placeholder: 'Start Date' },
            { key: 'endDate', placeholder: 'End Date' },
          ]}
          textareaKey="description"
          textareaPlaceholder="Details, honors, activities..."
          defaultEntry={{
            institution: '',
            degree: '',
            startDate: '',
            endDate: '',
            description: '',
          }}
          onUpdate={handleUpdate}
        />
      );
    case 'SKILLS':
      return <SkillsEditor content={content} onUpdate={handleUpdate} />;
    case 'CERTIFICATIONS':
    case 'ACHIEVEMENTS':
    case 'PUBLICATIONS':
    case 'AWARDS':
      return (
        <EntryListEditor
          content={content}
          entries={(content.entries as Array<Record<string, unknown>>) ?? []}
          fields={[
            {
              key: 'name',
              placeholder:
                (type === 'CERTIFICATIONS'
                  ? 'Certification'
                  : type === 'ACHIEVEMENTS'
                    ? 'Achievement'
                    : type === 'PUBLICATIONS'
                      ? 'Publication'
                      : 'Award') + ' Name',
            },
            { key: 'issuer', placeholder: 'Issuer / Organization' },
            { key: 'date', placeholder: 'Date' },
          ]}
          defaultEntry={{ name: '', issuer: '', date: '' }}
          onUpdate={handleUpdate}
        />
      );
    case 'PROJECTS':
      return (
        <EntryListEditor
          content={content}
          entries={(content.entries as Array<Record<string, unknown>>) ?? []}
          fields={[
            { key: 'name', placeholder: 'Project Name' },
            { key: 'url', placeholder: 'Project URL (optional)' },
          ]}
          textareaKey="description"
          textareaPlaceholder="Describe the project..."
          defaultEntry={{ name: '', description: '', url: '' }}
          onUpdate={handleUpdate}
        />
      );
    case 'LANGUAGES':
      return <LanguagesEditor content={content} onUpdate={handleUpdate} />;
    case 'INTERESTS':
      return (
        <TagsEditor content={content} onUpdate={handleUpdate} placeholder="Add an interest..." />
      );
    default:
      return <CustomEditor content={content} onUpdate={handleUpdate} />;
  }
}

// ── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  onUpdate,
  onToggle,
  onDelete,
  savingSectionId,
}: {
  section: ResumeSection;
  onUpdate: (id: string, content: Record<string, unknown>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  savingSectionId: string | null;
}) {
  const [open, setOpen] = useState(!section.isCollapsed);
  const isSaving = savingSectionId === section.id;

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
          {isSaving && <p className="text-xs text-muted-foreground mt-2">Saving...</p>}
        </div>
      )}
    </div>
  );
}

// ── Add Section Modal ────────────────────────────────────────────────────────

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
                onClose();
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

// ── Main Editor Component ────────────────────────────────────────────────────

export interface ResumeEditorProps {
  resumeId: string;
  onAddSection: (type: string, title?: string) => void;
}

export function ResumeEditor({ resumeId, onAddSection }: ResumeEditorProps) {
  const resume = useResumeStore((s) => s.resume);
  const savingSectionId = useResumeStore((s) => s.savingSectionId);
  const updateSectionContent = useResumeStore((s) => s.updateSectionContent);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const deleteSection = useResumeStore((s) => s.deleteSection);

  const [showAddModal, setShowAddModal] = useState(false);

  if (!resume) return null;

  return (
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
              savingSectionId={savingSectionId}
            />
          ))}
        </div>
      )}

      <AddSectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddSection}
        existingTypes={resume.sections.map((s) => s.type)}
      />
    </div>
  );
}

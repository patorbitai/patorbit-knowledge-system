'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type ResumeSection } from '@patorbit/types';
import { memo, useCallback, useState } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';

import { AVAILABLE_SECTION_TYPES, SECTION_ICONS, SECTION_LABELS } from './section-constants';

// ── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-xs text-red-500 mt-0.5">{errors[0]}</p>;
}

function inputCls(hasError?: boolean, custom?: string) {
  const base = 'w-full border rounded px-2 py-1.5 text-sm';
  const error = hasError
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
    : 'bg-background';
  return `${base} ${custom ?? ''} ${error}`;
}

// ── Section content editors ──────────────────────────────────────────────────

const PersonalInfoEditor = memo(function PersonalInfoEditor({
  content,
  onUpdate,
  errors,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
  errors?: Record<string, string[]>;
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
          className={inputCls(!!errors?.fullName)}
        />
        <FieldError errors={errors?.fullName} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Email</label>
        <input
          type="email"
          value={(content.email as string) ?? ''}
          onChange={(e) => setField('email', e.target.value)}
          className={inputCls(!!errors?.email)}
        />
        <FieldError errors={errors?.email} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Phone</label>
        <input
          type="text"
          value={(content.phone as string) ?? ''}
          onChange={(e) => setField('phone', e.target.value)}
          className={inputCls()}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Location</label>
        <input
          type="text"
          value={(content.location as string) ?? ''}
          onChange={(e) => setField('location', e.target.value)}
          className={inputCls()}
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium mb-1">LinkedIn URL</label>
        <input
          type="url"
          value={(content.linkedinUrl as string) ?? ''}
          onChange={(e) => setField('linkedinUrl', e.target.value)}
          className={inputCls(!!errors?.linkedinUrl)}
        />
        <FieldError errors={errors?.linkedinUrl} />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium mb-1">Website / Portfolio</label>
        <input
          type="url"
          value={(content.website as string) ?? ''}
          onChange={(e) => setField('website', e.target.value)}
          className={inputCls(!!errors?.website)}
        />
        <FieldError errors={errors?.website} />
      </div>
    </div>
  );
});

const SummaryEditor = memo(function SummaryEditor({
  content,
  onUpdate,
  errors,
}: {
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
  errors?: Record<string, string[]>;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">Summary</label>
      <textarea
        rows={4}
        value={(content.summary as string) ?? ''}
        onChange={(e) => onUpdate({ ...content, summary: e.target.value })}
        className={inputCls(!!errors?.summary, 'bg-background resize-y')}
        placeholder="Write a brief professional summary..."
      />
      <FieldError errors={errors?.summary} />
    </div>
  );
});

interface EntryEditorProps {
  entries: Array<Record<string, unknown>>;
  fields: Array<{ key: string; placeholder: string; colSpan?: boolean }>;
  textareaKey?: string;
  textareaPlaceholder?: string;
  defaultEntry: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
  content: Record<string, unknown>;
  errors?: Record<string, string[]>;
}

const EntryListEditor = memo(function EntryListEditor({
  entries,
  fields,
  textareaKey,
  textareaPlaceholder,
  defaultEntry,
  onUpdate,
  content,
  errors,
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
      {entries.map((entry, i) => {
        const getFieldError = (fieldKey: string) => errors?.[`entries.${i}.${fieldKey}`];
        return (
          <div key={i} className="p-3 border rounded bg-gray-50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {fields.map((field) => (
                <div key={field.key}>
                  <input
                    type="text"
                    value={(entry[field.key] as string) ?? ''}
                    onChange={(e) => updateEntry(i, { [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className={inputCls(
                      !!getFieldError(field.key),
                      `bg-white ${field.colSpan ? 'col-span-2' : ''}`,
                    )}
                  />
                  <FieldError errors={getFieldError(field.key)} />
                </div>
              ))}
            </div>
            {textareaKey && (
              <div>
                <textarea
                  rows={2}
                  value={(entry[textareaKey] as string) ?? ''}
                  onChange={(e) => updateEntry(i, { [textareaKey]: e.target.value })}
                  placeholder={textareaPlaceholder}
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white resize-y"
                />
                <FieldError errors={errors?.[`entries.${i}.${textareaKey}`]} />
              </div>
            )}
            <button
              onClick={() => removeEntry(i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        );
      })}
      <button onClick={addEntry} className="text-sm text-primary hover:underline">
        + Add Entry
      </button>
    </div>
  );
});

const SkillsEditor = memo(function SkillsEditor({
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
              aria-label={`Remove ${item}`}
              className="text-xs hover:text-red-500"
            >
              <span aria-hidden="true">×</span>
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
});

const LanguagesEditor = memo(function LanguagesEditor({
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
});

const TagsEditor = memo(function TagsEditor({
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
              aria-label={`Remove ${item}`}
              className="text-xs hover:text-red-500"
            >
              <span aria-hidden="true">×</span>
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
});

const CustomEditor = memo(function CustomEditor({
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
});

// ── Section Editor Router ────────────────────────────────────────────────────

const SectionEditor = memo(function SectionEditor({
  section,
  onUpdate,
}: {
  section: ResumeSection;
  onUpdate: (id: string, content: Record<string, unknown>) => void;
}) {
  const errors = useResumeStore((s) => s.validationErrors[section.id]);
  const content = section.content ?? {};
  const type = section.type;

  const handleUpdate = useCallback(
    (newContent: Record<string, unknown>) => {
      onUpdate(section.id, newContent);
    },
    [section.id, onUpdate],
  );

  switch (type) {
    case 'PERSONAL_INFORMATION':
      return <PersonalInfoEditor content={content} onUpdate={handleUpdate} errors={errors} />;
    case 'PROFESSIONAL_SUMMARY':
      return <SummaryEditor content={content} onUpdate={handleUpdate} errors={errors} />;
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
          errors={errors}
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
          errors={errors}
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
          errors={errors}
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
          errors={errors}
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
});

// ── Sortable Section Card ─────────────────────────────────────────────────────

const SortableSectionCard = memo(function SortableSectionCard({
  section,
  onUpdate,
  onToggle,
  onDelete,
}: {
  section: ResumeSection;
  onUpdate: (id: string, content: Record<string, unknown>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(!section.isCollapsed);
  const isSaving = useResumeStore((s) => s.savingSectionId === section.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: (isDragging ? 'relative' : undefined) as React.CSSProperties['position'],
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-card transition-all ${
        !section.isVisible ? 'opacity-50' : ''
      } ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => section.isCollapsible && setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <button
            className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground px-1 -ml-1"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to reorder section"
            type="button"
          >
            ⠿
          </button>
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
          {isSaving && (
            <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(section.id);
            }}
            aria-label={
              section.isVisible
                ? `Hide ${section.title ?? 'section'}`
                : `Show ${section.title ?? 'section'}`
            }
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
            type="button"
          >
            <span aria-hidden="true">{section.isVisible ? '👁️' : '🚫'}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(section.id);
            }}
            aria-label={`Delete ${section.title ?? 'section'}`}
            className="text-xs text-muted-foreground hover:text-red-500 px-2 py-1 rounded hover:bg-accent"
            type="button"
          >
            <span aria-hidden="true">🗑️</span>
          </button>
          {section.isCollapsible && (
            <span className="text-xs text-muted-foreground" aria-hidden="true">
              {open ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>
      {open && section.isVisible && (
        <div className="px-4 pb-4 border-t pt-3">
          <SectionEditor section={section} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
});

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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-section-modal-heading"
        className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
      >
        <h3 id="add-section-modal-heading" className="font-semibold mb-4">
          Add Section
        </h3>
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

export function ResumeEditor({ onAddSection }: ResumeEditorProps) {
  const resume = useResumeStore((s) => s.resume);
  const updateSectionContent = useResumeStore((s) => s.updateSectionContent);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const deleteSection = useResumeStore((s) => s.deleteSection);
  const reorderSections = useResumeStore((s) => s.reorderSections);

  const isAddSectionModalOpen = useResumeStore((s) => s.ui.isAddSectionModalOpen);
  const closeAddSectionModal = useResumeStore((s) => s.closeAddSectionModal);
  const openAddSectionModal = useResumeStore((s) => s.openAddSectionModal);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const sections = resume?.sections ?? [];
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sections, oldIndex, newIndex);
        reorderSections(reordered.map((s) => s.id));
      }
    },
    [resume?.sections, reorderSections],
  );

  if (!resume) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sections ({resume.sections.length})</h2>
        <button
          onClick={() => openAddSectionModal()}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
          type="button"
        >
          + Add Section
        </button>
      </div>

      {resume.sections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No sections yet. Click &quot;Add Section&quot; to get started.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={resume.sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {resume.sections.map((section) => (
                <div key={section.id} id={`section-${section.id}`}>
                  <SortableSectionCard
                    section={section}
                    onUpdate={updateSectionContent}
                    onToggle={toggleSection}
                    onDelete={deleteSection}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddSectionModal
        open={isAddSectionModalOpen}
        onClose={() => closeAddSectionModal()}
        onAdd={onAddSection}
        existingTypes={resume.sections.map((s) => s.type)}
      />
    </div>
  );
}

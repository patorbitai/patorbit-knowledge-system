// apps/web/src/components/resume/resume-preview.tsx
'use client';

import { useState } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';
import { cn } from '@/lib/utils';

import { type TemplateId, TemplateRenderer } from './template-renderer';

// --- Template Selector UI ---

const AVAILABLE_TEMPLATES: Array<{ id: TemplateId; name: string }> = [
  { id: 'default', name: 'Classic' },
  { id: 'modern', name: 'Modern' },
];

function TemplateSelector({
  selected,
  onSelect,
}: {
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}) {
  return (
    <div className="p-3 bg-gray-100 border-b flex items-center justify-center gap-2">
      <span className="text-xs font-medium text-gray-600">Template:</span>
      {AVAILABLE_TEMPLATES.map(({ id, name }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-full transition-colors',
            selected === id
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-200',
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

// --- Main Preview Component ---

export function ResumePreview({ className }: { className?: string }) {
  const resume = useResumeStore((s) => s.resume);
  const [templateId, setTemplateId] = useState<TemplateId>('default');

  if (!resume) {
    return (
      <div className={cn('flex items-center justify-center h-full text-gray-400', className)}>
        <p className="text-sm">No resume loaded</p>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      <TemplateSelector selected={templateId} onSelect={setTemplateId} />

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <TemplateRenderer templateId={templateId} />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

import { type PageSize, usePdfExport } from '@/lib/hooks/use-pdf-export';
import { useResumeStore } from '@/lib/stores/use-resume-store';
import { cn } from '@/lib/utils';

import { TemplateRenderer } from './template-renderer';
import { TEMPLATE_METADATA, type TemplateId } from './templates/registry';

export function ResumePreview({ className }: { className?: string }) {
  const resume = useResumeStore((s) => s.resume);
  const selectedTemplateId = useResumeStore((s) => s.selectedTemplateId);
  const setSelectedTemplate = useResumeStore((s) => s.setSelectedTemplate);
  const theme = useResumeStore((s) => s.theme);
  const { exportPdf, exporting, contentRef } = usePdfExport();

  const [pageSize, setPageSize] = useState<PageSize>('a4');

  if (!resume) {
    return (
      <div className={cn('flex items-center justify-center h-full text-gray-400', className)}>
        <p className="text-sm">No resume loaded</p>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header with template/export controls */}
      <div className="p-2 border-b shrink-0 space-y-2 no-print">
        <div className="flex gap-1 overflow-x-auto">
          {TEMPLATE_METADATA.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors',
                selectedTemplateId === t.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              )}
            >
              <span>{t.thumbnail}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-center items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as PageSize)}
            className="text-xs border rounded-md px-2 py-1 bg-background"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
          <button
            onClick={() => exportPdf(pageSize, resume?.title)}
            disabled={exporting}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div id="resume-print-area" ref={contentRef}>
          <TemplateRenderer templateId={selectedTemplateId as TemplateId} theme={theme} />
        </div>
      </div>
    </div>
  );
}

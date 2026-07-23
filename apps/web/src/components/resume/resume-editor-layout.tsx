// apps/web/src/components/resume/resume-editor-layout.tsx
'use client';

import { useResumeStore } from '@/lib/stores/use-resume-store';

import { ResumeEditor } from './resume-editor';
import { ResumePreview } from './resume-preview';

export interface ResumeEditorLayoutProps {
  resumeId: string;
}

export function ResumeEditorLayout({ resumeId }: ResumeEditorLayoutProps) {
  const resume = useResumeStore((s) => s.resume);
  const addSection = useResumeStore((s) => s.addSection);

  const handleAddSection = (type: string, title?: string) => {
    addSection(resumeId, type, title);
  };

  if (!resume) return null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Editor Panel */}
      <div className="w-full lg:w-1/2 xl:w-3/5 overflow-y-auto border-r">
        <div className="p-6 max-w-3xl mx-auto">
          <ResumeEditor resumeId={resumeId} onAddSection={handleAddSection} />
        </div>
      </div>

      {/* Preview Panel */}
      <div className="hidden lg:block lg:w-1/2 xl:w-2/5 border-l bg-gray-50">
        <ResumePreview />
      </div>
    </div>
  );
}

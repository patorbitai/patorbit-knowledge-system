'use client';

import { useMemo } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';

import { TemplateByConfig } from './templates/all-templates';
import { type ResumeTheme } from './templates/section-renderers';
import { type ResumeData } from './templates/types';

export function TemplateRenderer({
  templateId,
  theme,
}: {
  templateId: string;
  theme?: ResumeTheme;
}) {
  const resume = useResumeStore((s) => s.resume);

  const resumeData: ResumeData | null = useMemo(() => {
    if (!resume) return null;
    return {
      title: resume.title,
      sections: resume.sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content,
        isVisible: s.isVisible,
      })),
    };
  }, [resume]);

  if (!resumeData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No resume data to display.</p>
      </div>
    );
  }

  return <TemplateByConfig resume={resumeData} theme={theme} configId={templateId} />;
}

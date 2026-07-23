'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';

import { type ResumeData } from './templates/types';

// Map template IDs to their components using dynamic import for code splitting
const TEMPLATES = {
  default: dynamic(() => import('./templates/template-default').then((mod) => mod.TemplateDefault)),
  modern: dynamic(() => import('./templates/template-modern').then((mod) => mod.TemplateModern)),
};

export type TemplateId = keyof typeof TEMPLATES;

export function TemplateRenderer({ templateId }: { templateId: TemplateId }) {
  const resume = useResumeStore((s) => s.resume);

  // The renderer for the currently selected template
  const TemplateComponent = TEMPLATES[templateId] ?? TEMPLATES.default;

  // Memoize the data transformation to prevent re-calculating on every render
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

  return <TemplateComponent resume={resumeData} />;
}

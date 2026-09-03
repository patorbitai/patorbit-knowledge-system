"use client";

import { PaginatedResumeSheet } from "@/components/resume/PaginatedResumeSheet";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";
import type { Resume } from "@/types/resume";

interface PublicResumeViewerProps {
  data: {
    resumeId: string;
    resumeName: string;
    templateId: string;
    careerStage: string;
    resume: Record<string, unknown>;
  };
}

export function PublicResumeViewer({ data }: PublicResumeViewerProps) {
  const resume = data.resume as unknown as Resume;
  const template = TEMPLATES.find((t) => t.id === data.templateId) || TEMPLATES[0];

  return (
    <div className="flex justify-center">
      <PaginatedResumeSheet
        resume={resume}
        template={template}
        styleConfig={DEFAULT_STYLE_CONFIG}
      />
    </div>
  );
}

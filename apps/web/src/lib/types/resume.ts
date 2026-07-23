// apps/web/src/lib/types/resume.ts

export type ResumeSection = {
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

export type Resume = {
  id: string;
  title: string;
  status: string;
  templateId: string | null;
  version: number;
  sections: ResumeSection[];
};

export type ResumeVersion = {
  id: string;
  version: number;
  note: string | null;
  createdAt: string;
};

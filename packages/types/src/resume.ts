// packages/types/src/resume.ts

export type ResumeTheme = {
  fontFamily: string;
  fontSize: string;
  primaryColor: string;
  accentColor: string;
  sectionSpacing: string;
  lineHeight: string;
  pageMargins: string;
  headerStyle: 'default' | 'centered' | 'sidebar';
};

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
  theme: ResumeTheme | null;
  favorite: boolean;
  folderId: string | null;
  version: number;
  sections: ResumeSection[];
  createdAt: string;
  updatedAt: string;
};

export type ResumeVersion = {
  id: string;
  version: number;
  note: string | null;
  createdAt: string;
};

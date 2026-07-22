export interface ResumeData {
  title: string;
  status: string;
  sections: Array<{
    type: string;
    title?: string;
    content: unknown;
    sortOrder: number;
  }>;
  metadata: unknown;
  exportedAt: string;
}

export function generateJson(resume: any): string {
  const data: ResumeData = {
    title: resume.title,
    status: resume.status,
    sections: (resume.sections || []).map((s: any) => ({
      type: s.type,
      title: s.title,
      content: s.content,
      sortOrder: s.sortOrder,
    })),
    metadata: resume.metadata,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

// packages/types/src/cover-letter.ts
export type CoverLetter = {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  version: number;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
};

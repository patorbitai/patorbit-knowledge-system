// packages/types/src/folder.ts
import { type CoverLetter } from './cover-letter';
import { type Resume } from './resume';

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  resumes: Resume[];
  coverLetters: CoverLetter[];
  createdAt: string;
  updatedAt: string;
};

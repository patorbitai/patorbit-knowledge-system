// apps/web/src/lib/stores/use-workspace-store.ts
import { type CoverLetter, type Folder, type Resume } from '@patorbit/types';
import { create } from 'zustand';

export type WorkspaceStore = {
  resumes: Resume[];
  coverLetters: CoverLetter[];
  folders: Folder[];
  // ... more workspace state
};

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  resumes: [],
  coverLetters: [],
  folders: [],
}));

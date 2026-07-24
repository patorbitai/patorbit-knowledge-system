// apps/web/src/lib/stores/use-cover-letter-store.ts
import { type CoverLetter } from '@patorbit/types';
import { create } from 'zustand';

export type CoverLetterStore = {
  coverLetter: CoverLetter | null;
  // ... more cover letter state
};

export const useCoverLetterStore = create<CoverLetterStore>((set) => ({
  coverLetter: null,
}));

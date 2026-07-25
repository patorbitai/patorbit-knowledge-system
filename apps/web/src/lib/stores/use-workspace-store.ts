// apps/web/src/lib/stores/use-workspace-store.ts
import { type CoverLetter, type Folder, type Resume } from '@patorbit/types';
import { create } from 'zustand';

import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type SortField = 'updatedAt' | 'title' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export type WorkspaceFilter = {
  status?: string;
  favorite?: boolean;
  folderId?: string | null;
};

export type WorkspaceStore = {
  // ── Data ──
  resumes: Resume[];
  coverLetters: CoverLetter[];
  folders: Folder[];
  totalResumes: number;
  totalCoverLetters: number;

  // ── UI state ──
  loadingResumes: boolean;
  loadingCoverLetters: boolean;
  loadingFolders: boolean;
  error: string | null;

  // ── Search / Sort / Filter ──
  searchTerm: string;
  sortField: SortField;
  sortDir: SortDir;
  filter: WorkspaceFilter;
  currentFolderId: string | null;

  // ── Actions ──
  setSearchTerm: (term: string) => void;
  setSort: (field: SortField, dir?: SortDir) => void;
  setFilter: (filter: Partial<WorkspaceFilter>) => void;
  setCurrentFolder: (folderId: string | null) => void;
  clearFilters: () => void;

  fetchResumes: () => Promise<void>;
  fetchCoverLetters: () => Promise<void>;
  fetchFolders: () => Promise<void>;

  renameResume: (id: string, title: string) => Promise<void>;
  toggleFavoriteResume: (id: string, favorite: boolean) => Promise<void>;
  archiveResume: (id: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  moveResumeToFolder: (id: string, folderId: string | null) => Promise<void>;
  duplicateResume: (id: string) => Promise<void>;

  renameCoverLetter: (id: string, title: string) => Promise<void>;
  archiveCoverLetter: (id: string) => Promise<void>;
  deleteCoverLetter: (id: string) => Promise<void>;
  moveCoverLetterToFolder: (id: string, folderId: string | null) => Promise<void>;
  duplicateCoverLetter: (id: string) => Promise<void>;

  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
};

// ── Helpers ─────────────────────────────────────────────────────────────────────

function buildSortParam(sortField: SortField, sortDir: SortDir): string {
  return `${sortField}:${sortDir}`;
}

function pick<T extends Record<string, unknown>>(obj: T, ...keys: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

// ── Store ───────────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceStore>()((set, get) => ({
  resumes: [],
  coverLetters: [],
  folders: [],
  totalResumes: 0,
  totalCoverLetters: 0,

  loadingResumes: false,
  loadingCoverLetters: false,
  loadingFolders: false,
  error: null,

  searchTerm: '',
  sortField: 'updatedAt',
  sortDir: 'desc',
  filter: {},
  currentFolderId: null,

  // ── UI setters ──

  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setSort: (field: SortField, dir?: SortDir) => set({ sortField: field, sortDir: dir ?? 'desc' }),
  setFilter: (f: Partial<WorkspaceFilter>) => set((s) => ({ filter: { ...s.filter, ...f } })),
  setCurrentFolder: (folderId: string | null) => set({ currentFolderId: folderId }),
  clearFilters: () => set({ searchTerm: '', filter: {}, currentFolderId: null }),

  // ── Fetch helpers ──

  fetchResumes: async () => {
    set({ loadingResumes: true, error: null });
    try {
      const { searchTerm, sortField, sortDir, filter, currentFolderId } = get();
      const params: Record<string, string> = {
        limit: '50',
        sort: buildSortParam(sortField, sortDir),
      };
      if (searchTerm) params.search = searchTerm;
      if (filter.status) params.filter = `status:${filter.status}`;
      if (filter.favorite !== undefined) params.filter = `favorite:${filter.favorite}`;
      if (currentFolderId) params.filter = `folderId:${currentFolderId}`;

      const res = await api.get<{ data: Resume[]; meta: { total: number } }>('/resumes', params);
      set({ resumes: res.data, totalResumes: res.meta.total, loadingResumes: false });
    } catch {
      set({ error: 'Failed to load resumes', loadingResumes: false });
    }
  },

  fetchCoverLetters: async () => {
    set({ loadingCoverLetters: true, error: null });
    try {
      const { searchTerm, sortField, sortDir, filter, currentFolderId } = get();
      const params: Record<string, string> = {
        limit: '50',
        sort: buildSortParam(sortField, sortDir),
      };
      if (searchTerm) params.search = searchTerm;
      if (filter.status) params.status = filter.status;
      if (currentFolderId && currentFolderId !== 'root') params.folderId = currentFolderId;

      const res = await api.get<{ data: CoverLetter[]; meta: { total: number } }>(
        '/cover-letters',
        params,
      );
      set({
        coverLetters: res.data,
        totalCoverLetters: res.meta.total,
        loadingCoverLetters: false,
      });
    } catch {
      set({ error: 'Failed to load cover letters', loadingCoverLetters: false });
    }
  },

  fetchFolders: async () => {
    set({ loadingFolders: true });
    try {
      const data = await api.get<Folder[]>('/folders');
      set({ folders: data, loadingFolders: false });
    } catch {
      set({ loadingFolders: false });
    }
  },

  // ── Resume actions ──

  renameResume: async (id: string, title: string) => {
    await api.patch(`/resumes/${id}`, { title });
    set((s) => ({
      resumes: s.resumes.map((r) => (r.id === id ? { ...r, title } : r)),
    }));
  },

  toggleFavoriteResume: async (id: string, favorite: boolean) => {
    await api.patch(`/resumes/${id}`, { favorite });
    set((s) => ({
      resumes: s.resumes.map((r) => (r.id === id ? { ...r, favorite } : r)),
    }));
  },

  archiveResume: async (id: string) => {
    await api.patch(`/resumes/${id}`, { status: 'ARCHIVED' });
    set((s) => ({
      resumes: s.resumes.filter((r) => r.id !== id),
    }));
    get().fetchResumes();
  },

  deleteResume: async (id: string) => {
    await api.del(`/resumes/${id}`);
    set((s) => ({
      resumes: s.resumes.filter((r) => r.id !== id),
      totalResumes: Math.max(0, s.totalResumes - 1),
    }));
  },

  moveResumeToFolder: async (id: string, folderId: string | null) => {
    await api.patch(`/resumes/${id}`, { folderId: folderId ?? undefined });
    set((s) => ({
      resumes: s.resumes.map((r) => (r.id === id ? { ...r, folderId } : r)),
    }));
  },

  duplicateResume: async (id: string) => {
    const dup = await api.post<Resume>(`/resumes/${id}/duplicate`, {});
    set((s) => ({
      resumes: [dup, ...s.resumes],
      totalResumes: s.totalResumes + 1,
    }));
  },

  // ── Cover Letter actions ──

  renameCoverLetter: async (id: string, title: string) => {
    await api.patch(`/cover-letters/${id}`, { title });
    set((s) => ({
      coverLetters: s.coverLetters.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
  },

  archiveCoverLetter: async (id: string) => {
    await api.patch(`/cover-letters/${id}`, { status: 'ARCHIVED' });
    set((s) => ({
      coverLetters: s.coverLetters.filter((c) => c.id !== id),
    }));
  },

  deleteCoverLetter: async (id: string) => {
    await api.del(`/cover-letters/${id}`);
    set((s) => ({
      coverLetters: s.coverLetters.filter((c) => c.id !== id),
      totalCoverLetters: Math.max(0, s.totalCoverLetters - 1),
    }));
  },

  moveCoverLetterToFolder: async (id: string, folderId: string | null) => {
    await api.patch(`/cover-letters/${id}`, { folderId: folderId ?? undefined });
    set((s) => ({
      coverLetters: s.coverLetters.map((c) => (c.id === id ? { ...c, folderId } : c)),
    }));
  },

  duplicateCoverLetter: async (id: string) => {
    const dup = await api.post<CoverLetter>(`/cover-letters/${id}/duplicate`, {});
    set((s) => ({
      coverLetters: [dup, ...s.coverLetters],
      totalCoverLetters: s.totalCoverLetters + 1,
    }));
  },

  // ── Folder actions ──

  createFolder: async (name: string, parentId?: string | null) => {
    const folder = await api.post<Folder>('/folders', {
      name,
      ...(parentId ? { parentId } : {}),
    });
    set((s) => ({ folders: [...s.folders, folder] }));
  },

  renameFolder: async (id: string, name: string) => {
    await api.patch(`/folders/${id}`, { name });
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
    }));
  },

  deleteFolder: async (id: string) => {
    await api.del(`/folders/${id}`);
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      currentFolderId: s.currentFolderId === id ? null : s.currentFolderId,
    }));
  },
}));

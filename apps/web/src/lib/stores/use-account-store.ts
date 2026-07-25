// apps/web/src/lib/stores/use-account-store.ts
import { create } from 'zustand';

import { api } from '@/lib/api';

export type UserProfile = {
  id: string;
  name: string | null;
  headline: string | null;
  summary: string | null;
  avatarUrl: string | null;
  locale: string;
  timezone: string | null;
  preferences: Record<string, any> | null;
};

export type AccountStore = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<UserProfile, 'name' | 'headline' | 'summary' | 'locale'>>,
  ) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

export const useAccountStore = create<AccountStore>((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await api.get<UserProfile>('/account/profile');
      set({ profile, loading: false });
    } catch {
      set({ error: 'Failed to load profile', loading: false });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.patch<UserProfile>('/account/profile', data);
      set({ profile: updated, loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to update profile', loading: false });
      throw err;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ error: null });
    try {
      await api.post('/account/change-password', { currentPassword, newPassword });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to change password' });
      throw err;
    }
  },
}));

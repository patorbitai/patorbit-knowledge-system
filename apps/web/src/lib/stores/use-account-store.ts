// apps/web/src/lib/stores/use-account-store.ts
import { create } from 'zustand';

export type AccountStore = {
  profile: any | null; // Define a Profile type
  preferences: Record<string, any> | null;
};

export const useAccountStore = create<AccountStore>((set) => ({
  profile: null,
  preferences: null,
}));

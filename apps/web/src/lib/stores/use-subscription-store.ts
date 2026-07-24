// apps/web/src/lib/stores/use-subscription-store.ts
import { type Subscription } from '@patorbit/types';
import { create } from 'zustand';

export type SubscriptionStore = {
  subscription: Subscription | null;
  plans: any[]; // You should define a Plan type
  limits: Record<string, any> | null;
};

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscription: null,
  plans: [],
  limits: null,
}));

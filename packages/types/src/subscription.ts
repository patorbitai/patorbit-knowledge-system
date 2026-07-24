// packages/types/src/subscription.ts

export type Subscription = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  features: Record<string, any> | null;
};

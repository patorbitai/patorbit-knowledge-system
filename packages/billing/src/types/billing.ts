export type PlanInterval = 'month' | 'year';
export type PlanTier = 'free' | 'pro' | 'premium' | 'recruiter_pro' | 'recruiter_team' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'paused';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
export type BillingProviderType = 'stripe' | 'adyen';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  limits: PlanLimits;
  isActive: boolean;
  sortOrder: number;
}

export interface PlanLimits {
  maxResumes: number;
  maxClaims: number;
  maxPassportPublications: number;
  maxAIRequestsPerMonth: number;
  maxRecruiterSeats: number;
  maxOrganizationMembers: number;
  maxStorageMB: number;
  maxTeamWorkspaces: number;
  hasAIAssistant: boolean;
  hasATSKeywords: boolean;
  hasAdvancedAnalytics: boolean;
  hasApiAccess: boolean;
  hasSso: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
}

export interface Subscription {
  id: string;
  organizationId?: string;
  userId?: string;
  planId: string;
  status: SubscriptionStatus;
  interval: PlanInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, string>;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  paidAt?: Date;
  hostedUrl?: string;
  pdfUrl?: string;
}

export interface License {
  id: string;
  organizationId: string;
  subscriptionId: string;
  assignedUserId?: string;
  status: 'active' | 'suspended' | 'revoked';
  assignedAt?: Date;
  revokedAt?: Date;
}

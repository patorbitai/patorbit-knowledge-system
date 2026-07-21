import type { PlanTier, PlanLimits } from '../types';

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { maxResumes: 1, maxClaims: 10, maxPassportPublications: 1, maxAIRequestsPerMonth: 0, maxRecruiterSeats: 0, maxOrganizationMembers: 0, maxStorageMB: 50, maxTeamWorkspaces: 0, hasAIAssistant: false, hasATSKeywords: false, hasAdvancedAnalytics: false, hasApiAccess: false, hasSso: false, hasPrioritySupport: false, hasCustomBranding: false },
  pro: { maxResumes: 10, maxClaims: 100, maxPassportPublications: 5, maxAIRequestsPerMonth: 100, maxRecruiterSeats: 0, maxOrganizationMembers: 1, maxStorageMB: 500, maxTeamWorkspaces: 0, hasAIAssistant: true, hasATSKeywords: true, hasAdvancedAnalytics: false, hasApiAccess: false, hasSso: false, hasPrioritySupport: false, hasCustomBranding: false },
  premium: { maxResumes: 50, maxClaims: 500, maxPassportPublications: 25, maxAIRequestsPerMonth: 500, maxRecruiterSeats: 0, maxOrganizationMembers: 5, maxStorageMB: 2000, maxTeamWorkspaces: 0, hasAIAssistant: true, hasATSKeywords: true, hasAdvancedAnalytics: true, hasApiAccess: true, hasSso: false, hasPrioritySupport: false, hasCustomBranding: false },
  recruiter_pro: { maxResumes: 100, maxClaims: 1000, maxPassportPublications: 100, maxAIRequestsPerMonth: 500, maxRecruiterSeats: 1, maxOrganizationMembers: 10, maxStorageMB: 5000, maxTeamWorkspaces: 1, hasAIAssistant: true, hasATSKeywords: true, hasAdvancedAnalytics: true, hasApiAccess: true, hasSso: false, hasPrioritySupport: true, hasCustomBranding: false },
  recruiter_team: { maxResumes: 500, maxClaims: 5000, maxPassportPublications: 500, maxAIRequestsPerMonth: 2000, maxRecruiterSeats: 10, maxOrganizationMembers: 50, maxStorageMB: 20000, maxTeamWorkspaces: 5, hasAIAssistant: true, hasATSKeywords: true, hasAdvancedAnalytics: true, hasApiAccess: true, hasSso: true, hasPrioritySupport: true, hasCustomBranding: true },
  business: { maxResumes: 200, maxClaims: 2000, maxPassportPublications: 200, maxAIRequestsPerMonth: 1000, maxRecruiterSeats: 5, maxOrganizationMembers: 25, maxStorageMB: 10000, maxTeamWorkspaces: 3, hasAIAssistant: true, hasATSKeywords: true, hasAdvancedAnalytics: true, hasApiAccess: true, hasSso: true, hasPrioritySupport: true, hasCustomBranding: true },
  enterprise: { maxResumes: 9999, maxClaims: 99999, maxPassportPublications: 9999, maxAIRequestsPerMonth: 10000, maxRecruiterSeats: 999, maxOrganizationMembers: 9999, maxStorageMB: 100000, maxTeamWorkspaces: 999, hasAIAssistant: true, hasATSKeywords: true, hasAdvancedAnalytics: true, hasApiAccess: true, hasSso: true, hasPrioritySupport: true, hasCustomBranding: true },
};

export class FeatureGatingService {
  canCreateResume(tier: PlanTier, currentCount: number): boolean {
    return currentCount < PLAN_LIMITS[tier].maxResumes;
  }

  canCreateClaim(tier: PlanTier, currentCount: number): boolean {
    return currentCount < PLAN_LIMITS[tier].maxClaims;
  }

  canPublishPassport(tier: PlanTier, currentCount: number): boolean {
    return currentCount < PLAN_LIMITS[tier].maxPassportPublications;
  }

  canUseAI(tier: PlanTier): boolean {
    return PLAN_LIMITS[tier].hasAIAssistant;
  }

  remainingAIRequests(tier: PlanTier, usedThisMonth: number): number {
    return Math.max(0, PLAN_LIMITS[tier].maxAIRequestsPerMonth - usedThisMonth);
  }

  canAddRecruiterSeat(tier: PlanTier, currentSeats: number): boolean {
    return currentSeats < PLAN_LIMITS[tier].maxRecruiterSeats;
  }

  canAddOrganizationMember(tier: PlanTier, currentMembers: number): boolean {
    return currentMembers < PLAN_LIMITS[tier].maxOrganizationMembers;
  }

  canAddWorkspace(tier: PlanTier, currentWorkspaces: number): boolean {
    return currentWorkspaces < PLAN_LIMITS[tier].maxTeamWorkspaces;
  }

  canUseStorage(tier: PlanTier, currentStorageMB: number): boolean {
    return currentStorageMB <= PLAN_LIMITS[tier].maxStorageMB;
  }

  hasApiAccess(tier: PlanTier): boolean {
    return PLAN_LIMITS[tier].hasApiAccess;
  }

  hasSso(tier: PlanTier): boolean {
    return PLAN_LIMITS[tier].hasSso;
  }

  getLimits(tier: PlanTier): PlanLimits {
    return PLAN_LIMITS[tier];
  }
}

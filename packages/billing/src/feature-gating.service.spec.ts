import { describe, expect, it } from 'vitest';

import { FeatureGatingService } from './services/feature-gating.service';

describe('FeatureGatingService', () => {
  const service = new FeatureGatingService();

  describe('canCreateResume', () => {
    it('should allow creating a resume if under the limit', () => {
      expect(service.canCreateResume('free', 0)).toBe(true);
      expect(service.canCreateResume('pro', 9)).toBe(true);
    });

    it('should deny creating a resume if at or over the limit', () => {
      expect(service.canCreateResume('free', 1)).toBe(false);
      expect(service.canCreateResume('pro', 10)).toBe(false);
    });
  });

  describe('canCreateClaim', () => {
    it('should allow creating a claim if under the limit', () => {
      expect(service.canCreateClaim('free', 9)).toBe(true);
    });

    it('should deny creating a claim if at or over the limit', () => {
      expect(service.canCreateClaim('free', 10)).toBe(false);
    });
  });

  describe('canPublishPassport', () => {
    it('should allow publishing a passport if under the limit', () => {
      expect(service.canPublishPassport('pro', 4)).toBe(true);
    });

    it('should deny publishing a passport if at or over the limit', () => {
      expect(service.canPublishPassport('pro', 5)).toBe(false);
    });
  });

  describe('canUseAI', () => {
    it('should return true for plans with AI assistant', () => {
      expect(service.canUseAI('pro')).toBe(true);
      expect(service.canUseAI('enterprise')).toBe(true);
    });

    it('should return false for plans without AI assistant', () => {
      expect(service.canUseAI('free')).toBe(false);
    });
  });

  describe('remainingAIRequests', () => {
    it('should calculate remaining AI requests correctly', () => {
      expect(service.remainingAIRequests('pro', 50)).toBe(50);
      expect(service.remainingAIRequests('pro', 100)).toBe(0);
    });

    it('should return 0 if usage exceeds the limit', () => {
      expect(service.remainingAIRequests('pro', 150)).toBe(0);
    });

    it('should return 0 for plans with no AI requests', () => {
      expect(service.remainingAIRequests('free', 0)).toBe(0);
    });
  });

  describe('canAddRecruiterSeat', () => {
    it('should allow adding a seat if under the limit', () => {
      expect(service.canAddRecruiterSeat('recruiter_pro', 0)).toBe(true);
    });

    it('should deny adding a seat if at or over the limit', () => {
      expect(service.canAddRecruiterSeat('recruiter_pro', 1)).toBe(false);
    });

    it('should deny for plans with no recruiter seats', () => {
      expect(service.canAddRecruiterSeat('pro', 0)).toBe(false);
    });
  });

  describe('canAddOrganizationMember', () => {
    it('should allow adding a member if under the limit', () => {
      expect(service.canAddOrganizationMember('business', 24)).toBe(true);
    });

    it('should deny adding a member if at or over the limit', () => {
      expect(service.canAddOrganizationMember('business', 25)).toBe(false);
    });
  });

  describe('canAddWorkspace', () => {
    it('should allow adding a workspace if under the limit', () => {
      expect(service.canAddWorkspace('recruiter_team', 4)).toBe(true);
    });

    it('should deny adding a workspace if at or over the limit', () => {
      expect(service.canAddWorkspace('recruiter_team', 5)).toBe(false);
    });
  });

  describe('canUseStorage', () => {
    it('should allow using storage if under or at the limit', () => {
      expect(service.canUseStorage('pro', 499)).toBe(true);
      expect(service.canUseStorage('pro', 500)).toBe(true);
    });

    it('should deny using storage if over the limit', () => {
      expect(service.canUseStorage('pro', 501)).toBe(false);
    });
  });

  describe('hasApiAccess', () => {
    it('should return true for plans with API access', () => {
      expect(service.hasApiAccess('premium')).toBe(true);
    });

    it('should return false for plans without API access', () => {
      expect(service.hasApiAccess('pro')).toBe(false);
    });
  });

  describe('hasSso', () => {
    it('should return true for plans with SSO', () => {
      expect(service.hasSso('enterprise')).toBe(true);
    });

    it('should return false for plans without SSO', () => {
      expect(service.hasSso('premium')).toBe(false);
    });
  });

  describe('getLimits', () => {
    it('should return the correct limits object for a given plan tier', () => {
      const proLimits = service.getLimits('pro');
      expect(proLimits.maxResumes).toBe(10);
      expect(proLimits.hasAIAssistant).toBe(true);
      expect(proLimits.maxStorageMB).toBe(500);

      const enterpriseLimits = service.getLimits('enterprise');
      expect(enterpriseLimits.maxResumes).toBe(9999);
      expect(enterpriseLimits.hasSso).toBe(true);
    });

    it('should return a copy, not a reference', () => {
      const freeLimits = service.getLimits('free');
      freeLimits.maxResumes = 100;
      const newFreeLimits = service.getLimits('free');
      expect(newFreeLimits.maxResumes).toBe(1);
    });
  });
});

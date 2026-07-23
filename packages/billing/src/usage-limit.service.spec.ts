import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UsageLimitService, type UserPlanInfo, type UserStore } from './usage-limit.service';
import { FeatureGatingService } from './services/feature-gating.service';

const mockUserStore: UserStore = {
  getPlanInfo: vi.fn(),
};

describe('UsageLimitService', () => {
  let service: UsageLimitService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new UsageLimitService(mockUserStore, new FeatureGatingService());
  });

  function mockPlan(tier: string): UserPlanInfo {
    return { subscription: { plan: tier, status: 'active' } };
  }

  describe('user with free plan', () => {
    beforeEach(() => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('free'));
    });

    it('canCreateResume returns true for 0 resumes', async () => {
      await expect(service.canCreateResume('user_1', 0)).resolves.toBe(true);
    });

    it('canCreateResume returns false for 1 resume', async () => {
      await expect(service.canCreateResume('user_1', 1)).resolves.toBe(false);
    });

    it('canCreateClaim returns false at the limit', async () => {
      await expect(service.canCreateClaim('user_1', 10)).resolves.toBe(false);
    });

    it('canUseAI returns false', async () => {
      await expect(service.canUseAI('user_1')).resolves.toBe(false);
    });

    it('getRemainingAIRequests returns 0', async () => {
      await expect(service.getRemainingAIRequests('user_1', 0)).resolves.toBe(0);
    });

    it('canUseStorage returns false when over limit', async () => {
      await expect(service.canUseStorage('user_1', 51)).resolves.toBe(false);
    });
  });

  describe('user with pro plan', () => {
    beforeEach(() => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('pro'));
    });

    it('canCreateResume returns true up to 9', async () => {
      await expect(service.canCreateResume('user_pro', 9)).resolves.toBe(true);
      await expect(service.canCreateResume('user_pro', 10)).resolves.toBe(false);
    });

    it('canUseAI returns true', async () => {
      await expect(service.canUseAI('user_pro')).resolves.toBe(true);
    });

    it('getRemainingAIRequests calculates correctly', async () => {
      await expect(service.getRemainingAIRequests('user_pro', 30)).resolves.toBe(70);
    });
  });

  describe('user with premium plan', () => {
    beforeEach(() => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('premium'));
    });

    it('canCreateClaim returns true up to 499', async () => {
      await expect(service.canCreateClaim('user_prem', 499)).resolves.toBe(true);
    });

    it('canPublishPassport returns false at the limit', async () => {
      await expect(service.canPublishPassport('user_prem', 25)).resolves.toBe(false);
    });
  });

  describe('user with recruiter_pro plan', () => {
    beforeEach(() => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('recruiter_pro'));
    });

    it('canAddOrganizationMember returns true under the limit', async () => {
      await expect(service.canAddOrganizationMember('user_rec', 9)).resolves.toBe(true);
      await expect(service.canAddOrganizationMember('user_rec', 10)).resolves.toBe(false);
    });
  });

  describe('user with recruiter_team plan', () => {
    beforeEach(() => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('recruiter_team'));
    });

    it('canAddWorkspace respects plan limits', async () => {
      await expect(service.canAddWorkspace('user_team', 4)).resolves.toBe(true);
      await expect(service.canAddWorkspace('user_team', 5)).resolves.toBe(false);
    });
  });

  describe('user with enterprise plan', () => {
    beforeEach(() => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('enterprise'));
    });

    it('canCreateResume returns true for large values', async () => {
      await expect(service.canCreateResume('user_ent', 9998)).resolves.toBe(true);
      await expect(service.canCreateResume('user_ent', 9999)).resolves.toBe(false);
    });
  });

  describe('user with no subscription (fallback to free)', () => {
    beforeEach(() => {
      mockUserStore.getPlanInfo.mockResolvedValue({ subscription: null });
    });

    it('defaults to free tier limits', async () => {
      await expect(service.canCreateResume('user_none', 0)).resolves.toBe(true);
      await expect(service.canCreateResume('user_none', 1)).resolves.toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles unknown user by falling back to free', async () => {
      mockUserStore.getPlanInfo.mockResolvedValue(null);

      await expect(service.canCreateResume('unknown', 0)).resolves.toBe(true);
    });

    it('canCreateClaim checks limit correctly', async () => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('premium'));
      await expect(service.canCreateClaim('user', 500)).resolves.toBe(false);
      await expect(service.canCreateClaim('user', 0)).resolves.toBe(true);
    });

    it('canPublishPassport checks limit for pro', async () => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('pro'));
      await expect(service.canPublishPassport('user', 4)).resolves.toBe(true);
    });

    it('canUseStorage checks limit for pro', async () => {
      mockUserStore.getPlanInfo.mockResolvedValue(mockPlan('pro'));
      await expect(service.canUseStorage('user', 500)).resolves.toBe(true);
      await expect(service.canUseStorage('user', 501)).resolves.toBe(false);
    });
  });
});

import { describe, expect, it } from 'vitest';

import { FeatureGatingService } from './services/feature-gating.service';

describe('FeatureGatingService', () => {
  const service = new FeatureGatingService();

  it('should allow free users to create their first resume', () => {
    expect(service.canCreateResume('free', 0)).toBe(true);
  });

  it('should prevent free users from creating a second resume', () => {
    expect(service.canCreateResume('free', 1)).toBe(false);
  });

  it('should allow pro users to create up to 10 resumes', () => {
    expect(service.canCreateResume('pro', 9)).toBe(true);
    expect(service.canCreateResume('pro', 10)).toBe(false);
  });

  it('should return correct limits for a plan', () => {
    const limits = service.getLimits('pro');
    expect(limits.maxResumes).toBe(10);
    expect(limits.hasAIAssistant).toBe(true);
  });
});

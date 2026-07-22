import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureFlagsService],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize flags from environment variables', async () => {
      process.env.FEATURE_TEST_FLAG = 'true';
      process.env.FEATURE_ANOTHER_FLAG = 'false';

      await service.onModuleInit();

      expect(service.isEnabled('test_flag')).toBe(true);
      expect(service.isEnabled('another_flag')).toBe(false);

      delete process.env.FEATURE_TEST_FLAG;
      delete process.env.FEATURE_ANOTHER_FLAG;
    });

    it('should apply default flags if not set in environment', async () => {
      await service.onModuleInit();
      const allFlags = service.getAll();
      const resumeBuilder = allFlags.find(f => f.name === 'resume_builder');
      const careerPassport = allFlags.find(f => f.name === 'career_passport');

      expect(resumeBuilder?.enabled).toBe(false);
      expect(careerPassport?.enabled).toBe(true);
    });
  });

  describe('isEnabled', () => {
    it('should return true for an enabled flag', async () => {
      process.env.FEATURE_ENABLED_FLAG = 'true';
      await service.onModuleInit();
      expect(service.isEnabled('enabled_flag')).toBe(true);
      delete process.env.FEATURE_ENABLED_FLAG;
    });

    it('should return false for a disabled flag', async () => {
      process.env.FEATURE_DISABLED_FLAG = 'false';
      await service.onModuleInit();
      expect(service.isEnabled('disabled_flag')).toBe(false);
      delete process.env.FEATURE_DISABLED_FLAG;
    });

    it('should return false for a non-existent flag', async () => {
      await service.onModuleInit();
      expect(service.isEnabled('non_existent_flag')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all configured flags', async () => {
      process.env.FEATURE_GET_ALL_1 = 'true';
      process.env.FEATURE_GET_ALL_2 = 'false';

      await service.onModuleInit();

      const flags = service.getAll();

      // Includes defaults + env vars
      expect(flags.length).toBeGreaterThanOrEqual(2);

      const flag1 = flags.find(f => f.name === 'get_all_1');
      const flag2 = flags.find(f => f.name === 'get_all_2');

      expect(flag1).toBeDefined();
      expect(flag1?.enabled).toBe(true);
      expect(flag2).toBeDefined();
      expect(flag2?.enabled).toBe(false);

      delete process.env.FEATURE_GET_ALL_1;
      delete process.env.FEATURE_GET_ALL_2;
    });
  });
});

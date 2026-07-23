// apps/api/src/auth/strategies/jwt.strategy.spec.ts
import { Test, type TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: vi.fn().mockReturnValue('access-secret-at-least-32-chars!!'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // validate
  // -----------------------------------------------------------------------
  describe('validate', () => {
    it('returns user object for a valid access token payload', async () => {
      const payload = {
        sub: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        type: 'access',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('returns user object when role is undefined', async () => {
      const payload = {
        sub: 'user-2',
        email: 'nobody@example.com',
        type: 'access',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-2',
        email: 'nobody@example.com',
        role: undefined,
      });
    });

    it('returns null when payload type is "refresh"', async () => {
      const payload = {
        sub: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        type: 'refresh',
      };

      const result = await strategy.validate(payload);

      expect(result).toBeNull();
    });

    it('returns null when payload type is missing', async () => {
      const payload = {
        sub: 'user-3',
        email: 'test@example.com',
      } as any;

      const result = await strategy.validate(payload);

      expect(result).toBeNull();
    });
  });
});

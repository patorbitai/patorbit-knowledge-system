// apps/api/src/auth/token.service.spec.ts
import { Test, type TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
// Vitest globals are available (describe, it, expect, vi, beforeEach)

// ---------------------------------------------------------------------------
// Mock service objects
// ---------------------------------------------------------------------------
const mockJwtService = {
  sign: vi.fn(),
  verifyAsync: vi.fn(),
};

const mockConfigService = {
  getOrThrow: vi.fn(),
  get: vi.fn(),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Provide the environment values that are read in the constructor
    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      const secrets: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret-at-least-32-chars!!',
        JWT_REFRESH_SECRET: 'refresh-secret-at-least-32-chars!',
      };
      if (!secrets[key]) {
        throw new Error(`Missing env var: ${key}`);
      }
      return secrets[key];
    });
    mockConfigService.get.mockImplementation((key: string, fallback?: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_TOKEN_EXPIRATION: '15m',
        JWT_REFRESH_TOKEN_EXPIRATION: '7d',
      };
      return config[key] ?? fallback;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // generateTokens
  // -----------------------------------------------------------------------
  describe('generateTokens', () => {
    it('generates access and refresh tokens', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', role: 'USER' };
      mockJwtService.sign
        .mockReturnValueOnce('access-token-value')
        .mockReturnValueOnce('refresh-token-value');

      const result = await service.generateTokens(payload);

      // Access token
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        { ...payload, type: 'access' },
        {
          secret: 'access-secret-at-least-32-chars!!',
          expiresIn: '15m',
        },
      );
      // Refresh token
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        { ...payload, type: 'refresh' },
        {
          secret: 'refresh-secret-at-least-32-chars!',
          expiresIn: '7d',
        },
      );
      expect(result).toEqual({
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
      });
    });

    it('accepts a partial payload without a role', async () => {
      const payload = { sub: 'user-2', email: 'nobody@example.com' };
      mockJwtService.sign
        .mockReturnValueOnce('at')
        .mockReturnValueOnce('rt');

      const result = await service.generateTokens(payload as any);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('at');
      expect(result.refreshToken).toBe('rt');
    });
  });

  // -----------------------------------------------------------------------
  // verifyRefreshToken
  // -----------------------------------------------------------------------
  describe('verifyRefreshToken', () => {
    it('returns the payload for a valid refresh token', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', type: 'refresh' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyRefreshToken('valid-rt');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-rt', {
        secret: 'refresh-secret-at-least-32-chars!',
      });
      expect(result).toEqual(payload);
    });

    it('throws UnauthorizedException when the token type is not "refresh"', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', type: 'access' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      await expect(service.verifyRefreshToken('access-token-used-as-rt')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the token is expired / invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.verifyRefreshToken('expired-rt')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when jwt malformed', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

      await expect(service.verifyRefreshToken('garbage')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

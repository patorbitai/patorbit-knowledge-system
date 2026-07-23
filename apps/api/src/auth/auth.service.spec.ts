// apps/api/src/auth/auth.service.spec.ts
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@patorbit/database';
import { IdentityService } from '../identity/identity.service';
import { SessionService } from '../session/session.service';
import { TokenService } from './token.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CONFLICT_EXCEPTION_CODE, LOGIN_LOCKED_ERROR, TOKEN_ERROR } from '@patorbit/auth';

// ---------------------------------------------------------------------------
// Mock modules
// ---------------------------------------------------------------------------
vi.mock('@patorbit/auth', () => {
  const AUDIT_OUTCOME = { SUCCESS: 'success', FAILURE: 'failure' } as const;
  return {
    AUDIT_OUTCOME,
    LOCKOUT_THRESHOLD: 5,
    LOCKOUT_DURATION_MINUTES: 15,
    passwordService: {
      hash: vi.fn(),
      verify: vi.fn(),
    },
    CONFLICT_EXCEPTION_CODE,
    LOGIN_LOCKED_ERROR,
    TOKEN_ERROR,
  };
});

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-token'),
}));

// ---------------------------------------------------------------------------
// Mock service objects
// ---------------------------------------------------------------------------
const mockIdentityService = {
  createUser: vi.fn(),
  validateUser: vi.fn(),
  findUserById: vi.fn(),
};

const mockSessionService = {
  create: vi.fn(),
  validateAndRotate: vi.fn(),
  updateRefreshToken: vi.fn(),
  revoke: vi.fn(),
  listSessions: vi.fn(),
  revokeSessionById: vi.fn(),
  revokeAllUserSessions: vi.fn(),
};

const mockTokenService = {
  generateTokens: vi.fn(),
};

const mockAuditService = {
  log: vi.fn(),
};

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  verificationToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
};

const mockConfigService = {
  get: vi.fn(),
};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
const aUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  emailVerified: null,
  passwordHash: '$2b$12$hashedpassword',
  loginAttempts: 0,
  isLocked: false,
  lockExpiresAt: null,
  lastLoginAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  profile: { name: 'Test User', avatarUrl: null },
  userRoles: [{ role: { name: 'USER' } }],
  ...overrides,
});

const aSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  refreshToken: 'rt-valid',
  rememberMe: false,
  deviceType: null,
  deviceName: null,
  deviceOs: null,
  browser: null,
  ipAddress: null,
  isTrusted: false,
  revokedAt: null,
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
  lastUsedAt: null,
  expiresAt: new Date('2025-06-08'),
  refreshExpiresAt: new Date('2025-07-01'),
  ...overrides,
});

const tokens = { accessToken: 'at-abc123', refreshToken: 'rt-abc123' };

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('AuthService', () => {
  let service: AuthService;
  let identityService: typeof mockIdentityService;
  let sessionService: typeof mockSessionService;
  let tokenService: typeof mockTokenService;
  let auditService: typeof mockAuditService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfigService.get.mockReturnValue('http://localhost:3000');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: IdentityService, useValue: mockIdentityService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    identityService = module.get(IdentityService);
    sessionService = module.get(SessionService);
    tokenService = module.get(TokenService);
    auditService = module.get(AuditService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('registers a new user and audits the event', async () => {
      const dto = { email: 'new@example.com', password: 'Secret123!', name: 'Alice' };
      const created = aUser({ id: 'user-new', email: dto.email });
      mockIdentityService.createUser.mockResolvedValue(created);

      const result = await service.register(dto);

      expect(mockIdentityService.createUser).toHaveBeenCalledWith(dto);
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: created.id,
        action: 'user.register',
        outcome: 'success',
      });
      expect(result).toEqual({ id: created.id, email: created.email });
    });

    it('throws ConflictException when email is already registered', async () => {
      const dto = { email: 'existing@example.com', password: 'Secret123!' };
      mockIdentityService.createUser.mockRejectedValue(new Error('Email already in use'));

      await expect(service.register(dto)).rejects.toThrow();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens on successful login', async () => {
      const dto = { email: 'test@example.com', password: 'correct-password', rememberMe: false };
      const user = aUser();
      mockIdentityService.validateUser.mockResolvedValue(user);
      mockTokenService.generateTokens.mockResolvedValue(tokens);

      const result = await service.login(dto);

      expect(mockIdentityService.validateUser).toHaveBeenCalledWith(dto.email, dto.password);
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: 'USER',
        type: 'access',
      });
      expect(mockSessionService.create).toHaveBeenCalledWith(
        user.id,
        tokens.refreshToken,
        { rememberMe: false },
      );
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: user.id,
        action: 'user.login',
        outcome: 'success',
        metadata: { rememberMe: false },
      });
      expect(result).toEqual({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    });

    it('passes device metadata when provided', async () => {
      const dto = { email: 'test@example.com', password: 'pwd', rememberMe: true };
      const metadata = {
        ipAddress: '192.168.1.1',
        deviceType: 'mobile',
        deviceName: 'iPhone 15',
        deviceOs: 'iOS 18',
        browser: 'Safari',
      };
      mockIdentityService.validateUser.mockResolvedValue(aUser());
      mockTokenService.generateTokens.mockResolvedValue(tokens);

      await service.login(dto, metadata);

      expect(mockSessionService.create).toHaveBeenCalledWith(
        expect.any(String),
        tokens.refreshToken,
        { rememberMe: true, ...metadata },
      );
    });

    it('throws UnauthorizedException on invalid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'wrong-password' };
      mockIdentityService.validateUser.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow();

      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'user.login.failed',
        outcome: 'failure',
        metadata: { email: dto.email, reason: 'Invalid credentials' },
      });
    });

    it('propagates Locked error when account is locked', async () => {
      const dto = { email: 'locked@example.com', password: 'any-password' };
      mockIdentityService.validateUser.mockRejectedValue(new Error('Account is locked'));

      await expect(service.login(dto)).rejects.toThrow();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates tokens on valid refresh token', async () => {
      const user = aUser();
      const session = aSession({ user });
      mockSessionService.validateAndRotate.mockResolvedValue({ session, user });
      mockTokenService.generateTokens.mockResolvedValue({
        accessToken: 'at-new',
        refreshToken: 'rt-new',
      });

      const result = await service.refresh('rt-valid');

      expect(mockSessionService.validateAndRotate).toHaveBeenCalledWith('rt-valid');
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: 'USER',
        type: 'access',
      });
      expect(mockSessionService.updateRefreshToken).toHaveBeenCalledWith(
        session.id,
        'rt-new',
      );
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: user.id,
        action: 'user.refresh',
        outcome: 'success',
      });
      expect(result).toEqual({ accessToken: 'at-new', refreshToken: 'rt-new' });
    });

    it('throws UnauthorizedException on missing refresh token', async () => {
      await expect(service.refresh(undefined as unknown as string)).rejects.toThrow();
    });

    it('throws UnauthorizedException on invalid refresh token', async () => {
      mockSessionService.validateAndRotate.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refresh('rt-invalid')).rejects.toThrow();
    });

    it('throws UnauthorizedException on revoked session', async () => {
      mockSessionService.validateAndRotate.mockRejectedValue(new Error('Session revoked'));

      await expect(service.refresh('rt-revoked')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('revokes the session and audits on valid refresh token', async () => {
      const revoked = aSession({ revokedAt: new Date(), userId: 'user-1' });
      mockSessionService.revoke.mockResolvedValue(revoked);

      await service.logout('rt-valid');

      expect(mockSessionService.revoke).toHaveBeenCalledWith('rt-valid');
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'user.logout',
        outcome: 'success',
      });
    });

    it('does nothing when refresh token is not provided', async () => {
      await service.logout(undefined as unknown as string);

      expect(mockSessionService.revoke).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('is a no-op when session is not found', async () => {
      mockSessionService.revoke.mockResolvedValue(null);

      await service.logout('rt-ghost');

      expect(mockSessionService.revoke).toHaveBeenCalledWith('rt-ghost');
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('creates a reset token and returns a generic message for an existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(aUser());

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          token: 'mock-uuid-token',
          type: 'password_reset',
          expiresAt: expect.any(Date),
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'user.password_reset',
        outcome: 'success',
        metadata: { type: 'sent' },
      });
      expect(result.message).toBe(
        'If that email is registered, you will receive a reset link',
      );
      expect(result.resetUrl).toContain('/reset-password?token=mock-uuid-token');
    });

    it('returns a generic message for a non-existing user (no enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'unknown@example.com' });

      expect(mockPrisma.verificationToken.create).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'If that email is registered, you will receive a reset link',
      });
    });
  });

  describe('resetPassword', () => {
    it('resets the password, revokes sessions, and cleans up token', async () => {
      const tokenRecord = {
        id: 'vt-1',
        userId: 'user-1',
        token: 'valid-reset-token',
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 3600000),
      };
      mockPrisma.verificationToken.findUnique.mockResolvedValue(tokenRecord);

      const { passwordService } = await import('@patorbit/auth');
      passwordService.hash.mockResolvedValue('$2b$12$newhash');

      const dto = { token: 'valid-reset-token', password: 'NewStrongPass1!' };
      const result = await service.resetPassword(dto);

      expect(mockPrisma.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token: dto.token },
      });
      expect(passwordService.hash).toHaveBeenCalledWith(dto.password);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: '$2b$12$newhash' },
      });
      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith('user-1');
      expect(mockPrisma.verificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'vt-1' },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'user.password_reset',
        outcome: 'success',
        metadata: { type: 'reset' },
      });
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('throws BadRequestException when token does not exist', async () => {
      mockPrisma.verificationToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid-token', password: 'NewStrongPass1!' }),
      ).rejects.toThrow();
    });

    it('throws BadRequestException when token type is wrong', async () => {
      const tokenRecord = {
        id: 'vt-2',
        userId: 'user-2',
        token: 'email-verify-token',
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 3600000),
      };
      mockPrisma.verificationToken.findUnique.mockResolvedValue(tokenRecord);

      await expect(
        service.resetPassword({ token: 'email-verify-token', password: 'NewStrongPass1!' }),
      ).rejects.toThrow();
    });

    it('throws BadRequestException when token is expired', async () => {
      const tokenRecord = {
        id: 'vt-3',
        userId: 'user-3',
        token: 'expired-token',
        type: 'password_reset',
        expiresAt: new Date(Date.now() - 3600000),
      };
      mockPrisma.verificationToken.findUnique.mockResolvedValue(tokenRecord);

      await expect(
        service.resetPassword({ token: 'expired-token', password: 'NewStrongPass1!' }),
      ).rejects.toThrow();
    });
  });

  describe('getProfile', () => {
    it('returns the user profile by ID', async () => {
      const user = aUser();
      mockIdentityService.findUserById.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(mockIdentityService.findUserById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(user);
    });
  });

  describe('getSessions', () => {
    it('returns list of active sessions for the user', async () => {
      const sessions = [aSession({ id: 's-1' }), aSession({ id: 's-2' })];
      mockSessionService.listSessions.mockResolvedValue(sessions);

      const result = await service.getSessions('user-1');

      expect(mockSessionService.listSessions).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(sessions);
    });
  });

  describe('revokeSession', () => {
    it('revokes a specific session and audits', async () => {
      mockSessionService.revokeSessionById.mockResolvedValue({ count: 1 });

      const result = await service.revokeSession('session-1', 'user-1');

      expect(mockSessionService.revokeSessionById).toHaveBeenCalledWith('session-1', 'user-1');
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'session.revoke',
        outcome: 'success',
        metadata: { sessionId: 'session-1' },
      });
      expect(result).toEqual({ message: 'Session revoked' });
    });
  });

  describe('revokeAllSessions', () => {
    it('revokes all user sessions and audits', async () => {
      mockSessionService.revokeAllUserSessions.mockResolvedValue({ count: 3 });

      const result = await service.revokeAllSessions('user-1');

      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith('user-1', undefined);
      expect(mockAuditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'session.revoke',
        outcome: 'success',
        metadata: { all: true },
      });
      expect(result).toEqual({ message: 'All other sessions revoked' });
    });

    it('passes currentSessionId to exclude it from revocation', async () => {
      mockSessionService.revokeAllUserSessions.mockResolvedValue({ count: 2 });

      const result = await service.revokeAllSessions('user-1', 'session-current');

      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-1',
        'session-current',
      );
      expect(result).toEqual({ message: 'All other sessions revoked' });
    });
  });
});
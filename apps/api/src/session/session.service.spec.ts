import { Test, type TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from '@patorbit/database';
import { UnauthorizedException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockSession = {
  create: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

const mockPrismaService = {
  session: mockSession,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const aSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-id',
  userId: 'user-id',
  refreshToken: 'rt-abc123',
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

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('SessionService', () => {
  let service: SessionService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('creates a regular session (rememberMe=false)', async () => {
      const session = aSession({ rememberMe: false });
      mockSession.create.mockResolvedValue(session);

      const result = await service.create('user-id', 'rt-abc123');

      // Default: rememberMe = false -> 7 days session, 30 days refresh
      expect(mockSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-id',
          refreshToken: 'rt-abc123',
          rememberMe: false,
        }),
      });

      // Check expiry windows are roughly correct
      const callData = mockSession.create.mock.calls[0][0].data;
      const now = Date.now();
      expect(callData.expiresAt.getTime()).toBeGreaterThan(now + 6 * 86400000); // > 6 days
      expect(callData.expiresAt.getTime()).toBeLessThan(now + 8 * 86400000); // < 8 days
      expect(callData.refreshExpiresAt.getTime()).toBeGreaterThan(now + 29 * 86400000);
      expect(callData.refreshExpiresAt.getTime()).toBeLessThan(now + 31 * 86400000);

      expect(result).toEqual(session);
    });

    it('creates a long-lived session when rememberMe=true', async () => {
      const session = aSession({ rememberMe: true });
      mockSession.create.mockResolvedValue(session);

      const result = await service.create('user-id', 'rt-abc123', {
        rememberMe: true,
      });

      const callData = mockSession.create.mock.calls[0][0].data;

      // rememberMe -> 30 days session, 90 days refresh
      const now = Date.now();
      expect(callData.rememberMe).toBe(true);
      expect(callData.expiresAt.getTime()).toBeGreaterThan(now + 29 * 86400000);
      expect(callData.refreshExpiresAt.getTime()).toBeGreaterThan(
        now + 89 * 86400000,
      );

      expect(result).toEqual(session);
    });

    it('passes device metadata when provided', async () => {
      const options = {
        deviceType: 'mobile',
        deviceName: 'iPhone 15',
        deviceOs: 'iOS 18',
        browser: 'Safari',
        ipAddress: '192.168.1.1',
        rememberMe: false,
      };
      mockSession.create.mockResolvedValue(aSession(options));

      await service.create('user-id', 'rt-abc123', options);

      expect(mockSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceType: 'mobile',
          deviceName: 'iPhone 15',
          deviceOs: 'iOS 18',
          browser: 'Safari',
          ipAddress: '192.168.1.1',
        }),
      });
    });
  });

  // -----------------------------------------------------------------------
  // validateAndRotate
  // -----------------------------------------------------------------------
  describe('validateAndRotate', () => {
    it('returns session and user when the token is valid', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        userRoles: [{ role: { name: 'USER' } }],
      };
      const session = aSession({ user });

      mockSession.findUnique.mockResolvedValue(session);

      const result = await service.validateAndRotate('rt-abc123');

      expect(mockSession.findUnique).toHaveBeenCalledWith({
        where: { refreshToken: 'rt-abc123' },
        include: {
          user: { include: { userRoles: { include: { role: true } } } },
        },
      });
      expect(result.session).toEqual(session);
      expect(result.user).toEqual(user);
    });

    it('throws UnauthorizedException when session does not exist', async () => {
      mockSession.findUnique.mockResolvedValue(null);

      await expect(
        service.validateAndRotate('rt-invalid'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when session is revoked', async () => {
      const session = aSession({ revokedAt: new Date() });
      mockSession.findUnique.mockResolvedValue(session);

      await expect(
        service.validateAndRotate('rt-revoked'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when refresh token expired', async () => {
      const session = aSession({
        refreshExpiresAt: new Date(Date.now() - 86400000), // yesterday
      });
      mockSession.findUnique.mockResolvedValue(session);

      await expect(
        service.validateAndRotate('rt-expired'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // -----------------------------------------------------------------------
  // updateRefreshToken
  // -----------------------------------------------------------------------
  describe('updateRefreshToken', () => {
    it('updates refreshToken and lastUsedAt on the session', async () => {
      const updated = aSession({ refreshToken: 'rt-new', lastUsedAt: new Date() });
      mockSession.update.mockResolvedValue(updated);

      const result = await service.updateRefreshToken('session-id', 'rt-new');

      expect(mockSession.update).toHaveBeenCalledWith({
        where: { id: 'session-id' },
        data: {
          refreshToken: 'rt-new',
          lastUsedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(updated);
    });
  });

  // -----------------------------------------------------------------------
  // revoke
  // -----------------------------------------------------------------------
  describe('revoke', () => {
    it('sets revokedAt on the session', async () => {
      const revoked = aSession({ revokedAt: new Date() });
      mockSession.update.mockResolvedValue(revoked);

      const result = await service.revoke('rt-abc123');

      expect(mockSession.update).toHaveBeenCalledWith({
        where: { refreshToken: 'rt-abc123' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toEqual(revoked);
    });

    it('returns null when the refresh token does not exist (Prisma throws)', async () => {
      mockSession.update.mockRejectedValue(new Error('Not found'));

      const result = await service.revoke('rt-ghost');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // revokeSessionById
  // -----------------------------------------------------------------------
  describe('revokeSessionById', () => {
    it('revokes a specific session owned by the user', async () => {
      mockSession.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeSessionById('session-id', 'user-id');

      expect(mockSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-id', userId: 'user-id' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  // -----------------------------------------------------------------------
  // listSessions
  // -----------------------------------------------------------------------
  describe('listSessions', () => {
    it('returns active (non-revoked, non-expired) sessions for the user', async () => {
      const sessions = [
        aSession({ id: 's-1' }),
        aSession({ id: 's-2' }),
      ];
      mockSession.findMany.mockResolvedValue(sessions);

      const result = await service.listSessions('user-id');

      expect(mockSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          deviceType: true,
          deviceName: true,
          deviceOs: true,
          browser: true,
          ipAddress: true,
          isTrusted: true,
          rememberMe: true,
          lastUsedAt: true,
          createdAt: true,
          expiresAt: true,
        },
      });
      expect(result).toEqual(sessions);
    });

    it('returns an empty array when no active sessions', async () => {
      mockSession.findMany.mockResolvedValue([]);

      const result = await service.listSessions('user-id');

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // revokeAllUserSessions
  // -----------------------------------------------------------------------
  describe('revokeAllUserSessions', () => {
    it('revokes all sessions for the user', async () => {
      mockSession.updateMany.mockResolvedValue({ count: 3 });

      await service.revokeAllUserSessions('user-id');

      expect(mockSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('revokes all sessions except the excluded one', async () => {
      mockSession.updateMany.mockResolvedValue({ count: 2 });

      await service.revokeAllUserSessions('user-id', 'keep-session-id');

      expect(mockSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          revokedAt: null,
          id: { not: 'keep-session-id' },
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  // -----------------------------------------------------------------------
  // findByRefreshToken
  // -----------------------------------------------------------------------
  describe('findByRefreshToken', () => {
    it('returns a session with user and roles included', async () => {
      const user = {
        id: 'user-id',
        userRoles: [{ role: { name: 'USER' } }],
      };
      const session = aSession({ user });

      mockSession.findUnique.mockResolvedValue(session);

      const result = await service.findByRefreshToken('rt-abc123');

      expect(mockSession.findUnique).toHaveBeenCalledWith({
        where: { refreshToken: 'rt-abc123' },
        include: {
          user: { include: { userRoles: { include: { role: true } } } },
        },
      });
      expect(result).toEqual(session);
    });

    it('returns null when token is not found', async () => {
      mockSession.findUnique.mockResolvedValue(null);

      const result = await service.findByRefreshToken('rt-ghost');

      expect(result).toBeNull();
    });
  });
});

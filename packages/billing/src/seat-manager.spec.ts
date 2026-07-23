import { type Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SeatManager, type SeatRecord } from './seat-manager';
import { FeatureGatingService } from './services/feature-gating.service';

const mockSeatStore = {
  findAll: vi.fn(),
  count: vi.fn(),
  findActiveByUser: vi.fn(),
  findUnassigned: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
  countByOrganization: vi.fn(),
};

const mockOrgStore = {
  findWithSubscription: vi.fn(),
};

const mockOrg = {
  id: 'org_123',
  subscription: { id: 'sub_123', plan: 'recruiter_pro', status: 'active' },
};

describe('SeatManager', () => {
  let seatManager: SeatManager;

  beforeEach(() => {
    vi.resetAllMocks();
    seatManager = new SeatManager(
      mockSeatStore as any,
      mockOrgStore as any,
      new FeatureGatingService(),
    );
  });

  describe('listSeats', () => {
    it('should return all seats for an organization', async () => {
      const seats: SeatRecord[] = [
        {
          id: 'lic_1',
          organizationId: 'org_123',
          subscriptionId: 'sub_123',
          assignedUserId: 'user_1',
          status: 'active',
          assignedAt: new Date(),
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'lic_2',
          organizationId: 'org_123',
          subscriptionId: 'sub_123',
          assignedUserId: null,
          status: 'active',
          assignedAt: null,
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockSeatStore.findAll as Mock).mockResolvedValue(seats);

      const result = await seatManager.listSeats('org_123');

      expect(mockSeatStore.findAll).toHaveBeenCalledWith('org_123');
      expect(result).toEqual(seats);
    });
  });

  describe('assignSeat', () => {
    it('should assign a seat when within limits and user has no seat', async () => {
      (mockOrgStore.findWithSubscription as Mock).mockResolvedValue(mockOrg);
      (mockSeatStore.count as Mock).mockResolvedValue(0);
      (mockSeatStore.findActiveByUser as Mock).mockResolvedValue(null);
      const newSeat: SeatRecord = {
        id: 'lic_new',
        organizationId: 'org_123',
        subscriptionId: 'sub_123',
        assignedUserId: 'user_456',
        status: 'active',
        assignedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockSeatStore.create as Mock).mockResolvedValue(newSeat);

      const result = await seatManager.assignSeat('org_123', 'sub_123', 'user_456');

      expect(mockSeatStore.create).toHaveBeenCalledWith({
        organizationId: 'org_123',
        subscriptionId: 'sub_123',
        assignedUserId: 'user_456',
      });
      expect(result).toEqual(newSeat);
    });

    it('should throw when the organization has no subscription', async () => {
      (mockOrgStore.findWithSubscription as Mock).mockResolvedValue({
        id: 'org_123',
        subscription: null,
      });

      await expect(seatManager.assignSeat('org_123', 'sub_123', 'user_456')).rejects.toThrow(
        'Organization does not have an active subscription.',
      );
    });

    it('should throw when the seat limit is reached', async () => {
      (mockOrgStore.findWithSubscription as Mock).mockResolvedValue(mockOrg);
      (mockSeatStore.count as Mock).mockResolvedValue(1); // recruiter_pro max = 1

      await expect(seatManager.assignSeat('org_123', 'sub_123', 'user_456')).rejects.toThrow(
        'Seat limit reached for the current plan.',
      );
    });

    it('should throw when the user already has an active seat', async () => {
      (mockOrgStore.findWithSubscription as Mock).mockResolvedValue(mockOrg);
      (mockSeatStore.count as Mock).mockResolvedValue(0);
      (mockSeatStore.findActiveByUser as Mock).mockResolvedValue({
        id: 'lic_existing',
      } as SeatRecord);

      await expect(seatManager.assignSeat('org_123', 'sub_123', 'user_456')).rejects.toThrow(
        'User already has an active seat in this organization.',
      );
    });

    it('should throw if the org is not found', async () => {
      (mockOrgStore.findWithSubscription as Mock).mockResolvedValue(null);

      await expect(seatManager.assignSeat('org_missing', 'sub_123', 'user_456')).rejects.toThrow(
        'Organization does not have an active subscription.',
      );
    });
  });

  describe('revokeSeat', () => {
    it('should revoke an active seat', async () => {
      const activeSeat: SeatRecord = {
        id: 'lic_123',
        organizationId: 'org_123',
        subscriptionId: 'sub_123',
        assignedUserId: 'user_456',
        status: 'active',
        assignedAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockSeatStore.findActiveByUser as Mock).mockResolvedValue(activeSeat);
      const revokedSeat = {
        ...activeSeat,
        status: 'revoked',
        assignedUserId: null,
        revokedAt: new Date(),
      };
      (mockSeatStore.revoke as Mock).mockResolvedValue(revokedSeat);

      const result = await seatManager.revokeSeat('org_123', 'user_456');

      expect(mockSeatStore.findActiveByUser).toHaveBeenCalledWith('org_123', 'user_456');
      expect(mockSeatStore.revoke).toHaveBeenCalledWith('lic_123');
      expect(result.status).toBe('revoked');
    });

    it('should throw when no active seat is found', async () => {
      (mockSeatStore.findActiveByUser as Mock).mockResolvedValue(null);

      await expect(seatManager.revokeSeat('org_123', 'user_456')).rejects.toThrow(
        'No active seat found for this user in this organization.',
      );
    });
  });
});

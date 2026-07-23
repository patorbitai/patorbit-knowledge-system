import { type FeatureGatingService } from './services/feature-gating.service';
import { type PlanTier } from './types';

export interface SeatRecord {
  id: string;
  organizationId: string;
  subscriptionId: string;
  assignedUserId: string | null;
  status: string;
  assignedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeatStore {
  findAll(organizationId: string): Promise<SeatRecord[]>;
  count(organizationId: string): Promise<number>;
  findActiveByUser(organizationId: string, userId: string): Promise<SeatRecord | null>;
  findUnassigned(organizationId: string): Promise<SeatRecord[]>;
  create(data: {
    organizationId: string;
    subscriptionId: string;
    assignedUserId: string;
  }): Promise<SeatRecord>;
  revoke(seatId: string): Promise<SeatRecord>;
  countByOrganization(organizationId: string): Promise<number>;
}

export interface OrganizationWithSubscription {
  id: string;
  subscription: { id: string; plan: PlanTier; status: string } | null;
}

export interface OrgStore {
  findWithSubscription(organizationId: string): Promise<OrganizationWithSubscription | null>;
}

export class SeatManager {
  constructor(
    private readonly seatStore: SeatStore,
    private readonly orgStore: OrgStore,
    private readonly featureGating: FeatureGatingService,
  ) {}

  async getSeatCount(organizationId: string): Promise<number> {
    return this.seatStore.countByOrganization(organizationId);
  }

  async getAvailableSeats(organizationId: string, subscriptionTier: PlanTier): Promise<number> {
    const current = await this.getSeatCount(organizationId);
    const limits = this.featureGating.getLimits(subscriptionTier);
    return Math.max(0, limits.maxRecruiterSeats - current);
  }

  async canAssignSeat(organizationId: string, subscriptionTier: PlanTier): Promise<boolean> {
    return (await this.getAvailableSeats(organizationId, subscriptionTier)) > 0;
  }

  async listSeats(organizationId: string): Promise<SeatRecord[]> {
    return this.seatStore.findAll(organizationId);
  }

  async assignSeat(
    organizationId: string,
    _subscriptionId: string,
    userId: string,
  ): Promise<SeatRecord> {
    const org = await this.orgStore.findWithSubscription(organizationId);
    if (!org?.subscription) {
      throw new Error('Organization does not have an active subscription.');
    }

    const currentSeats = await this.seatStore.count(organizationId);
    const limits = this.featureGating.getLimits(org.subscription.plan);
    if (currentSeats >= limits.maxRecruiterSeats) {
      throw new Error('Seat limit reached for the current plan.');
    }

    const existing = await this.seatStore.findActiveByUser(organizationId, userId);
    if (existing) {
      throw new Error('User already has an active seat in this organization.');
    }

    return this.seatStore.create({
      organizationId,
      subscriptionId: org.subscription.id,
      assignedUserId: userId,
    });
  }

  async unassignSeat(licenseId: string): Promise<SeatRecord> {
    return this.seatStore.revoke(licenseId);
  }

  async revokeSeat(organizationId: string, userId: string): Promise<SeatRecord> {
    const seat = await this.seatStore.findActiveByUser(organizationId, userId);
    if (!seat) {
      throw new Error('No active seat found for this user in this organization.');
    }
    return this.seatStore.revoke(seat.id);
  }

  async getSeatsByOrganization(organizationId: string): Promise<SeatRecord[]> {
    return this.seatStore.findAll(organizationId);
  }
}

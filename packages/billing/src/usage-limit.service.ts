export class UsageLimitService {
  private readonly usage = new Map<string, Map<string, number>>();

  async recordUsage(organizationId: string, metric: string, amount: number = 1): Promise<void> {
    const orgUsage = this.usage.get(organizationId) ?? new Map();
    const current = orgUsage.get(metric) ?? 0;
    orgUsage.set(metric, current + amount);
    this.usage.set(organizationId, orgUsage);
  }

  async getUsage(organizationId: string, metric: string): Promise<number> {
    return this.usage.get(organizationId)?.get(metric) ?? 0;
  }

  async canUseFeature(
    organizationId: string,
    metric: string,
    maxAllowed: number,
  ): Promise<boolean> {
    const current = await this.getUsage(organizationId, metric);
    return current < maxAllowed;
  }

  async getRemaining(organizationId: string, metric: string, maxAllowed: number): Promise<number> {
    const current = await this.getUsage(organizationId, metric);
    return Math.max(0, maxAllowed - current);
  }

  async resetUsage(organizationId: string): Promise<void> {
    this.usage.set(organizationId, new Map());
  }
}

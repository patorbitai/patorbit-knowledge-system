const TTL_MS = 86_400_000; // 24 hours — Stripe webhooks can be replayed within 3 days

export class InMemoryIdempotencyStore {
  private readonly processed = new Map<string, number>();

  async exists(eventId: string): Promise<boolean> {
    const ts = this.processed.get(eventId);
    if (ts === undefined) return false;
    if (Date.now() - ts > TTL_MS) {
      this.processed.delete(eventId);
      return false;
    }
    return true;
  }

  async mark(eventId: string): Promise<void> {
    this.processed.set(eventId, Date.now());
  }
}

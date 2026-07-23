import { type BillingProvider } from './interfaces';

export interface SubscriptionUpdater {
  updatePlan(organizationId: string, plan: string, status: string): Promise<void>;
  cancel(organizationId: string): Promise<void>;
}

export interface PaymentLogger {
  recordPayment(
    subscriptionId: string,
    amount: number,
    currency: string,
    invoiceId: string,
  ): Promise<void>;
  recordFailedPayment(subscriptionId: string, invoiceId: string, reason: string): Promise<void>;
}

export interface OrgLookup {
  findByCustomerId(customerId: string): Promise<{ id: string } | null>;
}

export interface IdempotencyStore {
  /** Returns true if the event ID has already been processed. */
  exists(eventId: string): Promise<boolean>;
  /** Marks the event ID as processed. TTL is set automatically. */
  mark(eventId: string): Promise<void>;
}

export class WebhookHandler {
  constructor(
    private readonly provider: BillingProvider,
    private readonly subscriptionUpdater: SubscriptionUpdater,
    private readonly paymentLogger: PaymentLogger,
    private readonly orgLookup: OrgLookup,
    private readonly idempotencyStore: IdempotencyStore,
  ) {}

  async handleEvent(
    payload: Buffer,
    signature: string,
  ): Promise<{ handled: boolean; event: string }> {
    const { event, data } = await this.provider.handleWebhook(payload, signature);

    // Extract event ID for idempotency
    const eventObj = data as Record<string, any>;
    const eventId = (eventObj?.id ?? event) as string;

    // Skip if this event has already been processed
    if (await this.idempotencyStore.exists(eventId)) {
      return { handled: false, event };
    }

    await this.idempotencyStore.mark(eventId);

    switch (event) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subData = data as Record<string, any>;
        const customerId = subData.customer as string;
        const org = await this.orgLookup.findByCustomerId(customerId);
        if (org) {
          await this.subscriptionUpdater.updatePlan(
            org.id,
            subData.items?.data?.[0]?.price?.id ?? subData.plan?.id ?? 'unknown',
            subData.status as string,
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subData = data as Record<string, any>;
        const customerId = subData.customer as string;
        const org = await this.orgLookup.findByCustomerId(customerId);
        if (org) {
          await this.subscriptionUpdater.cancel(org.id);
        }
        break;
      }

      case 'invoice.paid': {
        const invoiceData = data as Record<string, any>;
        const subscriptionId = invoiceData.subscription as string;
        const amount = (invoiceData.amount_paid as number) ?? 0;
        const currency = (invoiceData.currency as string) ?? 'usd';
        const invoiceId = invoiceData.id as string;
        await this.paymentLogger.recordPayment(
          subscriptionId ?? 'unknown',
          amount,
          currency,
          invoiceId,
        );
        break;
      }

      case 'invoice.payment_failed': {
        const failData = data as Record<string, any>;
        const subId = failData.subscription as string;
        const invId = failData.id as string;
        await this.paymentLogger.recordFailedPayment(
          subId ?? 'unknown',
          invId,
          (failData.last_payment_error?.message as string) ?? 'Unknown error',
        );
        break;
      }

      default:
        break;
    }

    return { handled: true, event };
  }
}

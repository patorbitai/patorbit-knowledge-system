import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WebhookHandler } from './webhook-handler';
import type { SubscriptionUpdater, PaymentLogger, OrgLookup } from './webhook-handler';

const mockProvider = {
  handleWebhook: vi.fn(),
};

const mockSubscriptionUpdater: SubscriptionUpdater = {
  updatePlan: vi.fn(),
  cancel: vi.fn(),
};

const mockPaymentLogger: PaymentLogger = {
  recordPayment: vi.fn(),
  recordFailedPayment: vi.fn(),
};

const mockOrgLookup: OrgLookup = {
  findByCustomerId: vi.fn(),
};

describe('WebhookHandler', () => {
  let handler: WebhookHandler;

  beforeEach(() => {
    vi.resetAllMocks();
    handler = new WebhookHandler(
      mockProvider as any,
      mockSubscriptionUpdater,
      mockPaymentLogger,
      mockOrgLookup,
    );
  });

  const defaultPayload = Buffer.from('{}');
  const defaultSignature = 't=123,s=sig123';

  describe('customer.subscription.created', () => {
    it('should update the plan when the event is received', async () => {
      const eventData = {
        customer: 'cus_123',
        status: 'active',
        items: { data: [{ price: { id: 'pro_month' } }] },
      };
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'customer.subscription.created',
        data: eventData,
      });
      mockOrgLookup.findByCustomerId.mockResolvedValue({ id: 'org_456' });

      const result = await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockOrgLookup.findByCustomerId).toHaveBeenCalledWith('cus_123');
      expect(mockSubscriptionUpdater.updatePlan).toHaveBeenCalledWith('org_456', 'pro_month', 'active');
      expect(result).toEqual({ handled: true, event: 'customer.subscription.created' });
    });

    it('should skip if no matching organization is found', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'customer.subscription.created',
        data: { customer: 'cus_unknown', items: { data: [] } },
      });
      mockOrgLookup.findByCustomerId.mockResolvedValue(null);

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockSubscriptionUpdater.updatePlan).not.toHaveBeenCalled();
    });

    it('should handle missing items gracefully', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'customer.subscription.created',
        data: { customer: 'cus_123', status: 'active' },
      });
      mockOrgLookup.findByCustomerId.mockResolvedValue({ id: 'org_456' });

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockSubscriptionUpdater.updatePlan).toHaveBeenCalledWith('org_456', 'unknown', 'active');
    });
  });

  describe('customer.subscription.updated', () => {
    it('should update the plan', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'customer.subscription.updated',
        data: { customer: 'cus_123', status: 'past_due', items: { data: [{ price: { id: 'premium_month' } }] } },
      });
      mockOrgLookup.findByCustomerId.mockResolvedValue({ id: 'org_789' });

      const result = await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockSubscriptionUpdater.updatePlan).toHaveBeenCalledWith('org_789', 'premium_month', 'past_due');
      expect(result.event).toBe('customer.subscription.updated');
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should cancel the subscription for the organization', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'customer.subscription.deleted',
        data: { customer: 'cus_123' },
      });
      mockOrgLookup.findByCustomerId.mockResolvedValue({ id: 'org_456' });

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockSubscriptionUpdater.cancel).toHaveBeenCalledWith('org_456');
    });

    it('should skip if no matching organization', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'customer.subscription.deleted',
        data: { customer: 'cus_unknown' },
      });
      mockOrgLookup.findByCustomerId.mockResolvedValue(null);

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockSubscriptionUpdater.cancel).not.toHaveBeenCalled();
    });
  });

  describe('invoice.paid', () => {
    it('should record the payment', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'invoice.paid',
        data: { id: 'in_123', subscription: 'sub_456', amount_paid: 2900, currency: 'usd' },
      });

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockPaymentLogger.recordPayment).toHaveBeenCalledWith('sub_456', 2900, 'usd', 'in_123');
    });

    it('should handle missing subscription reference gracefully', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'invoice.paid',
        data: { id: 'in_999', amount_paid: 0, currency: 'eur' },
      });

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockPaymentLogger.recordPayment).toHaveBeenCalledWith('unknown', 0, 'eur', 'in_999');
    });
  });

  describe('invoice.payment_failed', () => {
    it('should record the failed payment with error message', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'invoice.payment_failed',
        data: { id: 'in_fail', subscription: 'sub_456', last_payment_error: { message: 'card_declined' } },
      });

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockPaymentLogger.recordFailedPayment).toHaveBeenCalledWith('sub_456', 'in_fail', 'card_declined');
    });

    it('should handle missing error object gracefully', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'invoice.payment_failed',
        data: { id: 'in_fail', subscription: 'sub_456' },
      });

      await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockPaymentLogger.recordFailedPayment).toHaveBeenCalledWith('sub_456', 'in_fail', 'Unknown error');
    });
  });

  describe('unhandled events', () => {
    it('should ignore events without special handling', async () => {
      mockProvider.handleWebhook.mockResolvedValue({
        event: 'charge.succeeded',
        data: { id: 'ch_123' },
      });

      const result = await handler.handleEvent(defaultPayload, defaultSignature);

      expect(mockSubscriptionUpdater.updatePlan).not.toHaveBeenCalled();
      expect(mockSubscriptionUpdater.cancel).not.toHaveBeenCalled();
      expect(mockPaymentLogger.recordPayment).not.toHaveBeenCalled();
      expect(mockPaymentLogger.recordFailedPayment).not.toHaveBeenCalled();
      expect(result).toEqual({ handled: true, event: 'charge.succeeded' });
    });
  });

  describe('provider error handling', () => {
    it('should propagate errors from the provider', async () => {
      mockProvider.handleWebhook.mockRejectedValue(new Error('Invalid signature'));

      await expect(handler.handleEvent(defaultPayload, defaultSignature))
        .rejects.toThrow('Invalid signature');
    });
  });
});

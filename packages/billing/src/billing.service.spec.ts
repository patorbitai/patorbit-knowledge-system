import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BillingService } from './services/billing.service';
import type { BillingProvider } from './interfaces';
import type { CreateCheckoutSessionParams, CreateCustomerPortalParams, CreateSubscriptionParams, UpdateSubscriptionParams } from './interfaces';

const mockProvider: BillingProvider = {
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
  createCheckoutSession: vi.fn(),
  createCustomerPortal: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
  getSubscription: vi.fn(),
  listInvoices: vi.fn(),
  createInvoice: vi.fn(),
  refundPayment: vi.fn(),
  handleWebhook: vi.fn(),
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new BillingService(mockProvider);
  });

  describe('createCustomer', () => {
    it('should create a customer and return the id', async () => {
      (mockProvider.createCustomer as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cus_123' });

      const result = await service.createCustomer('test@example.com', 'Test User');

      expect(mockProvider.createCustomer).toHaveBeenCalledWith('test@example.com', 'Test User');
      expect(result).toEqual({ id: 'cus_123' });
    });

    it('should create a customer without a name', async () => {
      (mockProvider.createCustomer as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cus_456' });

      const result = await service.createCustomer('anon@example.com');

      expect(mockProvider.createCustomer).toHaveBeenCalledWith('anon@example.com', undefined);
      expect(result).toEqual({ id: 'cus_456' });
    });

    it('should propagate provider errors', async () => {
      (mockProvider.createCustomer as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Stripe API error'));

      await expect(service.createCustomer('fail@example.com')).rejects.toThrow('Stripe API error');
    });
  });

  describe('createCheckoutSession', () => {
    const baseParams: CreateCheckoutSessionParams = {
      customerId: 'cus_123',
      planId: 'pro',
      interval: 'month',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    it('should create a checkout session', async () => {
      (mockProvider.createCheckoutSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123',
        sessionId: 'cs_123',
      });

      const result = await service.createCheckoutSession(baseParams);

      expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith(baseParams);
      expect(result).toEqual({ url: 'https://checkout.stripe.com/session_123', sessionId: 'cs_123' });
    });

    it('should pass optional trial days and metadata', async () => {
      const paramsWithExtras: CreateCheckoutSessionParams = {
        ...baseParams,
        trialDays: 14,
        metadata: { source: 'onboarding' },
      };
      (mockProvider.createCheckoutSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        url: 'https://checkout.stripe.com/session_456',
        sessionId: 'cs_456',
      });

      await service.createCheckoutSession(paramsWithExtras);

      expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith(paramsWithExtras);
    });

    it('should propagate provider errors', async () => {
      (mockProvider.createCheckoutSession as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Provider error'));

      await expect(service.createCheckoutSession(baseParams)).rejects.toThrow('Provider error');
    });
  });

  describe('createCustomerPortal', () => {
    it('should create a customer portal session', async () => {
      const params: CreateCustomerPortalParams = { customerId: 'cus_123', returnUrl: 'https://example.com/settings' };
      (mockProvider.createCustomerPortal as ReturnType<typeof vi.fn>).mockResolvedValue({
        url: 'https://billing.stripe.com/portal_123',
      });

      const result = await service.createCustomerPortal(params);

      expect(mockProvider.createCustomerPortal).toHaveBeenCalledWith(params);
      expect(result).toEqual({ url: 'https://billing.stripe.com/portal_123' });
    });

    it('should propagate provider errors', async () => {
      const params: CreateCustomerPortalParams = { customerId: 'cus_999', returnUrl: 'https://example.com' };
      (mockProvider.createCustomerPortal as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Customer not found'));

      await expect(service.createCustomerPortal(params)).rejects.toThrow('Customer not found');
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const params: CreateSubscriptionParams = { customerId: 'cus_123', planId: 'pro', interval: 'month' };
      (mockProvider.createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sub_123', status: 'active' });

      const result = await service.createSubscription(params);

      expect(mockProvider.createSubscription).toHaveBeenCalledWith(params);
      expect(result).toEqual({ id: 'sub_123', status: 'active' });
    });

    it('should create a subscription with a trial period and metadata', async () => {
      const params: CreateSubscriptionParams = {
        customerId: 'cus_123',
        planId: 'premium',
        interval: 'year',
        trialDays: 30,
        metadata: { promo_code: 'YEARLY30' },
      };
      (mockProvider.createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sub_456', status: 'trialing' });

      const result = await service.createSubscription(params);

      expect(mockProvider.createSubscription).toHaveBeenCalledWith(params);
      expect(result.status).toBe('trialing');
    });

    it('should propagate provider errors', async () => {
      const params: CreateSubscriptionParams = { customerId: 'cus_bad', planId: 'pro', interval: 'month' };
      (mockProvider.createSubscription as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid customer'));

      await expect(service.createSubscription(params)).rejects.toThrow('Invalid customer');
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription plan and interval', async () => {
      const params: UpdateSubscriptionParams = { subscriptionId: 'sub_123', planId: 'premium', interval: 'year' };
      (mockProvider.updateSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sub_123', status: 'active' });

      const result = await service.updateSubscription(params);

      expect(mockProvider.updateSubscription).toHaveBeenCalledWith(params);
      expect(result).toEqual({ id: 'sub_123', status: 'active' });
    });

    it('should propagate provider errors', async () => {
      const params: UpdateSubscriptionParams = { subscriptionId: 'sub_missing', planId: 'pro', interval: 'month' };
      (mockProvider.updateSubscription as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Subscription not found'));

      await expect(service.updateSubscription(params)).rejects.toThrow('Subscription not found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      (mockProvider.cancelSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sub_123', status: 'canceled' });

      const result = await service.cancelSubscription('sub_123');

      expect(mockProvider.cancelSubscription).toHaveBeenCalledWith('sub_123');
      expect(result.status).toBe('canceled');
    });

    it('should propagate provider errors', async () => {
      (mockProvider.cancelSubscription as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Subscription already canceled'));

      await expect(service.cancelSubscription('sub_already_canceled')).rejects.toThrow('Subscription already canceled');
    });
  });

  describe('resumeSubscription', () => {
    it('should resume a canceled subscription', async () => {
      (mockProvider.resumeSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sub_123', status: 'active' });

      const result = await service.resumeSubscription('sub_123');

      expect(mockProvider.resumeSubscription).toHaveBeenCalledWith('sub_123');
      expect(result.status).toBe('active');
    });

    it('should propagate provider errors', async () => {
      (mockProvider.resumeSubscription as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Cannot resume subscription'));

      await expect(service.resumeSubscription('sub_canceled')).rejects.toThrow('Cannot resume subscription');
    });
  });

  describe('getSubscription', () => {
    it('should retrieve a subscription', async () => {
      (mockProvider.getSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        planId: 'pro',
      });

      const result = await service.getSubscription('sub_123');

      expect(mockProvider.getSubscription).toHaveBeenCalledWith('sub_123');
      expect(result.planId).toBe('pro');
    });

    it('should propagate provider errors', async () => {
      (mockProvider.getSubscription as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Subscription not found'));

      await expect(service.getSubscription('sub_missing')).rejects.toThrow('Subscription not found');
    });
  });

  describe('listInvoices', () => {
    it('should list invoices for a customer', async () => {
      const invoices = [
        { id: 'in_123', status: 'paid', amount: 1200, currency: 'usd', createdAt: new Date() },
        { id: 'in_124', status: 'open', amount: 2900, currency: 'usd', createdAt: new Date() },
      ];
      (mockProvider.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue(invoices);

      const result = await service.listInvoices('cus_123');

      expect(mockProvider.listInvoices).toHaveBeenCalledWith('cus_123');
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('paid');
    });

    it('should return an empty array when no invoices exist', async () => {
      (mockProvider.listInvoices as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.listInvoices('cus_new');

      expect(result).toEqual([]);
    });

    it('should propagate provider errors', async () => {
      (mockProvider.listInvoices as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Customer not found'));

      await expect(service.listInvoices('cus_missing')).rejects.toThrow('Customer not found');
    });
  });

  describe('handleWebhook', () => {
    it('should handle a webhook event', async () => {
      const payload = Buffer.from('{"type":"invoice.paid"}');
      const signature = 'sig_123';
      const event = { event: 'invoice.paid', data: { id: 'in_123' } };
      (mockProvider.handleWebhook as ReturnType<typeof vi.fn>).mockResolvedValue(event);

      const result = await service.handleWebhook(payload, signature);

      expect(mockProvider.handleWebhook).toHaveBeenCalledWith(payload, signature);
      expect(result.event).toBe('invoice.paid');
    });

    it('should propagate provider errors (e.g., invalid signature)', async () => {
      const payload = Buffer.from('{}');
      const signature = 'bad_sig';
      (mockProvider.handleWebhook as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid signature'));

      await expect(service.handleWebhook(payload, signature)).rejects.toThrow('Invalid signature');
    });
  });
});

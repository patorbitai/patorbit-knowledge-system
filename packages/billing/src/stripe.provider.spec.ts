import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StripeProvider } from './stripe.provider';

vi.mock('stripe', () => {
  const MockStripe = vi.fn(() => ({
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
    subscriptions: {
      create: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
      retrieve: vi.fn(),
    },
    invoices: {
      list: vi.fn(),
      create: vi.fn(),
    },
    invoiceItems: {
      create: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  }));
  return { default: MockStripe };
});

describe('StripeProvider', () => {
  let provider: StripeProvider;
  let mockStripeInstance: any;

  const apiKey = 'sk_test_mockkey';

  beforeEach(() => {
    vi.resetAllMocks();
    provider = new StripeProvider(apiKey);
    mockStripeInstance = (provider as any).stripe;
  });

  describe('createCustomer', () => {
    it('should create a customer with email and name', async () => {
      mockStripeInstance.customers.create.mockResolvedValue({ id: 'cus_123' });

      const result = await provider.createCustomer('test@example.com', 'Test User');

      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({ email: 'test@example.com', name: 'Test User' });
      expect(result).toEqual({ id: 'cus_123' });
    });

    it('should create a customer with email only', async () => {
      mockStripeInstance.customers.create.mockResolvedValue({ id: 'cus_456' });

      const result = await provider.createCustomer('anon@example.com');

      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({ email: 'anon@example.com', name: undefined });
      expect(result).toEqual({ id: 'cus_456' });
    });

    it('should propagate Stripe errors', async () => {
      mockStripeInstance.customers.create.mockRejectedValue(new Error('Invalid email'));

      await expect(provider.createCustomer('bad-email')).rejects.toThrow('Invalid email');
    });
  });

  describe('getCustomer', () => {
    it('should retrieve a customer', async () => {
      mockStripeInstance.customers.retrieve.mockResolvedValue({ id: 'cus_123', email: 'test@example.com', deleted: false });

      const result = await provider.getCustomer('cus_123');

      expect(result).toEqual({ id: 'cus_123', email: 'test@example.com' });
    });

    it('should throw if customer is deleted', async () => {
      mockStripeInstance.customers.retrieve.mockResolvedValue({ id: 'cus_deleted', deleted: true });

      await expect(provider.getCustomer('cus_deleted')).rejects.toThrow('Customer deleted');
    });

    it('should return empty string for email if undefined', async () => {
      mockStripeInstance.customers.retrieve.mockResolvedValue({ id: 'cus_123', email: undefined, deleted: false });

      const result = await provider.getCustomer('cus_123');

      expect(result.email).toBe('');
    });
  });

  describe('createCheckoutSession', () => {
    const params = {
      customerId: 'cus_123',
      planId: 'pro',
      interval: 'month' as const,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    it('should create a checkout session', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/123' });

      const result = await provider.createCheckoutSession(params);

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        payment_method_types: ['card'],
        line_items: [{ price: 'pro_month', quantity: 1 }],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        subscription_data: { trial_period_days: undefined, metadata: undefined },
      });
      expect(result).toEqual({ url: 'https://checkout.stripe.com/123', sessionId: 'cs_123' });
    });

    it('should pass trial days and metadata when provided', async () => {
      const paramsWithExtras = { ...params, trialDays: 14, metadata: { source: 'email' } };
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({ id: 'cs_456', url: 'https://checkout.stripe.com/456' });

      await provider.createCheckoutSession(paramsWithExtras);

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: { trial_period_days: 14, metadata: { source: 'email' } },
        }),
      );
    });

    it('should throw if session URL is missing', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({ id: 'cs_bad', url: null });

      await expect(provider.createCheckoutSession(params)).rejects.toThrow('Stripe Checkout session URL not found');
    });
  });

  describe('createCustomerPortal', () => {
    it('should create a billing portal session', async () => {
      mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/portal_123' });

      const result = await provider.createCustomerPortal({ customerId: 'cus_123', returnUrl: 'https://example.com/portal' });

      expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'https://example.com/portal',
      });
      expect(result).toEqual({ url: 'https://billing.stripe.com/portal_123' });
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const subscriptionData = { id: 'sub_123', status: 'active', latest_invoice: { payment_intent: { client_secret: 'pi_secret' } } };
      mockStripeInstance.subscriptions.create.mockResolvedValue(subscriptionData);

      const result = await provider.createSubscription({ customerId: 'cus_123', planId: 'pro', interval: 'month' });

      expect(mockStripeInstance.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        items: [{ price: 'pro_month' }],
        trial_period_days: undefined,
        metadata: undefined,
        expand: ['latest_invoice.payment_intent'],
      });
      expect(result).toEqual({ id: 'sub_123', status: 'active' });
    });

    it('should create a subscription with trial and metadata', async () => {
      mockStripeInstance.subscriptions.create.mockResolvedValue({ id: 'sub_456', status: 'trialing' });

      const result = await provider.createSubscription({
        customerId: 'cus_123', planId: 'premium', interval: 'year', trialDays: 30, metadata: { promo: 'YEARLY' },
      });

      expect(mockStripeInstance.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          trial_period_days: 30,
          metadata: { promo: 'YEARLY' },
        }),
      );
      expect(result.status).toBe('trialing');
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription to a new plan', async () => {
      const existingSub = { id: 'sub_123', items: { data: [{ id: 'si_123' }] } };
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue(existingSub);
      mockStripeInstance.subscriptions.update.mockResolvedValue({ id: 'sub_123', status: 'active' });

      const result = await provider.updateSubscription({ subscriptionId: 'sub_123', planId: 'premium', interval: 'year' });

      expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
      expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        items: [{ id: 'si_123', price: 'premium_year' }],
        proration_behavior: 'create_prorations',
      });
      expect(result).toEqual({ id: 'sub_123', status: 'active' });
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      mockStripeInstance.subscriptions.cancel.mockResolvedValue({ id: 'sub_123', status: 'canceled' });

      const result = await provider.cancelSubscription('sub_123');

      expect(mockStripeInstance.subscriptions.cancel).toHaveBeenCalledWith('sub_123');
      expect(result.status).toBe('canceled');
    });
  });

  describe('resumeSubscription', () => {
    it('should resume a subscription by setting cancel_at_period_end to false', async () => {
      mockStripeInstance.subscriptions.update.mockResolvedValue({ id: 'sub_123', status: 'active' });

      const result = await provider.resumeSubscription('sub_123');

      expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_123', { cancel_at_period_end: false });
      expect(result.status).toBe('active');
    });
  });

  describe('getSubscription', () => {
    it('should retrieve subscription details', async () => {
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        items: { data: [{ price: { id: 'pro_month' } }] },
      });

      const result = await provider.getSubscription('sub_123');

      expect(result).toEqual({ id: 'sub_123', status: 'active', planId: 'pro_month' });
    });

    it('should return empty planId when no items exist', async () => {
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_empty',
        status: 'active',
        items: { data: [] },
      });

      const result = await provider.getSubscription('sub_empty');

      expect(result.planId).toBe('');
    });
  });

  describe('listInvoices', () => {
    it('should list and transform invoices', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockStripeInstance.invoices.list.mockResolvedValue({
        data: [
          { id: 'in_123', status: 'paid', amount_due: 1200, currency: 'usd', created: now, hosted_invoice_url: 'https://invoice.stripe.com/123', invoice_pdf: 'https://invoice.stripe.com/123/pdf' },
          { id: 'in_456', status: 'open', amount_due: 2900, currency: 'usd', created: now },
        ],
      });

      const result = await provider.listInvoices('cus_123');

      expect(mockStripeInstance.invoices.list).toHaveBeenCalledWith({ customer: 'cus_123', limit: 100 });
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('paid');
      expect(result[0].amount).toBe(1200);
      expect(result[0].hostedUrl).toBe('https://invoice.stripe.com/123');
      expect(result[0].pdfUrl).toBe('https://invoice.stripe.com/123/pdf');
      expect(result[1].hostedUrl).toBeUndefined();
    });

    it('should return an empty array when no invoices exist', async () => {
      mockStripeInstance.invoices.list.mockResolvedValue({ data: [] });

      const result = await provider.listInvoices('cus_new');

      expect(result).toEqual([]);
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice item and an invoice', async () => {
      mockStripeInstance.invoiceItems.create.mockResolvedValue({ id: 'ii_123' });
      mockStripeInstance.invoices.create.mockResolvedValue({ id: 'in_123' });

      const result = await provider.createInvoice('cus_123', 2000, 'usd');

      expect(mockStripeInstance.invoiceItems.create).toHaveBeenCalledWith({ customer: 'cus_123', amount: 2000, currency: 'usd' });
      expect(mockStripeInstance.invoices.create).toHaveBeenCalledWith({ customer: 'cus_123', auto_advance: true });
      expect(result).toEqual({ id: 'in_123' });
    });
  });

  describe('refundPayment', () => {
    it('should create a refund for a payment intent', async () => {
      mockStripeInstance.refunds.create.mockResolvedValue({ id: 'rf_123' });

      const result = await provider.refundPayment('pi_123');

      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_123', amount: undefined });
      expect(result).toEqual({ id: 'rf_123' });
    });

    it('should create a partial refund when amount is specified', async () => {
      mockStripeInstance.refunds.create.mockResolvedValue({ id: 'rf_456' });

      await provider.refundPayment('pi_123', 500);

      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_123', amount: 500 });
    });
  });

  describe('handleWebhook', () => {
    const processEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...processEnv, STRIPE_WEBHOOK_SECRET: 'whsec_test' };
    });

    afterEach(() => {
      process.env = processEnv;
    });

    it('should construct and return a webhook event', async () => {
      const payload = Buffer.from('{"type":"invoice.paid","data":{"object":{"id":"in_123"}}}');
      const signature = 't=123,s=abc';
      const mockEvent = { type: 'invoice.paid', data: { object: { id: 'in_123' } } };
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await provider.handleWebhook(payload, signature);

      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(payload, signature, 'whsec_test');
      expect(result).toEqual({ event: 'invoice.paid', data: { id: 'in_123' } });
    });

    it('should throw when webhook secret is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      await expect(provider.handleWebhook(Buffer.from('{}'), 'sig'))
        .rejects.toThrow('Stripe webhook secret is not configured.');
    });

    it('should propagate Stripe webhook signature verification errors', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      await expect(provider.handleWebhook(Buffer.from('{}'), 'bad_sig'))
        .rejects.toThrow('No signatures found matching the expected signature');
    });
  });
});

import  { type BillingProvider } from '../interfaces';
import  { type InvoiceStatus,type PlanInterval, type PlanTier, type SubscriptionStatus } from '../types';

export class BillingService {
  constructor(private provider: BillingProvider) {}

  async createCustomer(email: string, name?: string) {
    return this.provider.createCustomer(email, name);
  }

  async createCheckoutSession(params: {
    customerId: string;
    planId: string;
    interval: PlanInterval;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    trialDays?: number;
  }) {
    return this.provider.createCheckoutSession(params);
  }

  async createCustomerPortal(params: { customerId: string; returnUrl: string }) {
    return this.provider.createCustomerPortal(params);
  }

  async createSubscription(params: {
    customerId: string;
    planId: string;
    interval: PlanInterval;
    trialDays?: number;
    metadata?: Record<string, string>;
  }) {
    return this.provider.createSubscription(params);
  }

  async updateSubscription(params: { subscriptionId: string; planId: string; interval: PlanInterval }) {
    return this.provider.updateSubscription(params);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.provider.cancelSubscription(subscriptionId);
  }

  async resumeSubscription(subscriptionId: string) {
    return this.provider.resumeSubscription(subscriptionId);
  }

  async getSubscription(subscriptionId: string) {
    return this.provider.getSubscription(subscriptionId);
  }

  async listInvoices(customerId: string) {
    return this.provider.listInvoices(customerId);
  }

  async handleWebhook(payload: Buffer, signature: string) {
    return this.provider.handleWebhook(payload, signature);
  }
}

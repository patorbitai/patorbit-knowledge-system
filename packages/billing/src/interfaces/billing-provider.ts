import type { PlanInterval, SubscriptionStatus, InvoiceStatus } from '../types';

export interface CreateCheckoutSessionParams {
  customerId: string;
  planId: string;
  interval: PlanInterval;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trialDays?: number;
}

export interface CreateCustomerPortalParams {
  customerId: string;
  returnUrl: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  planId: string;
  interval: PlanInterval;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  planId: string;
  interval: PlanInterval;
}

export interface BillingProvider {
  createCustomer(email: string, name?: string): Promise<{ id: string }>;
  getCustomer(customerId: string): Promise<{ id: string; email: string }>;
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string; sessionId: string }>;
  createCustomerPortal(params: CreateCustomerPortalParams): Promise<{ url: string }>;
  createSubscription(params: CreateSubscriptionParams): Promise<{ id: string; status: SubscriptionStatus }>;
  updateSubscription(params: UpdateSubscriptionParams): Promise<{ id: string; status: SubscriptionStatus }>;
  cancelSubscription(subscriptionId: string): Promise<{ id: string; status: SubscriptionStatus }>;
  resumeSubscription(subscriptionId: string): Promise<{ id: string; status: SubscriptionStatus }>;
  getSubscription(subscriptionId: string): Promise<{ id: string; status: SubscriptionStatus; planId: string }>;
  listInvoices(customerId: string): Promise<{ id: string; status: InvoiceStatus; amount: number; currency: string; createdAt: Date }[]>;
  createInvoice(customerId: string, amount: number, currency: string): Promise<{ id: string }>;
  refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string }>;
  handleWebhook(payload: Buffer, signature: string): Promise<{ event: string; data: Record<string, unknown> }>;
}

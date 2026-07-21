import Stripe from 'stripe';
import type {
  BillingProvider,
  CreateCheckoutSessionParams,
  CreateCustomerPortalParams,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
} from '../interfaces';
import type { InvoiceStatus, SubscriptionStatus } from '../types';

export class StripeProvider implements BillingProvider {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async createCustomer(email: string, name?: string) {
    const customer = await this.stripe.customers.create({ email, name });
    return { id: customer.id };
  }

  async getCustomer(customerId: string) {
    const customer = await this.stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error('Customer deleted');
    }
    return { id: customer.id, email: customer.email ?? '' };
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    const { customerId, planId, interval, successUrl, cancelUrl, metadata, trialDays } = params;
    const priceId = `${planId}_${interval}`; // Assumes price IDs are structured this way

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialDays,
        metadata,
      },
    });

    if (!session.url) {
      throw new Error('Stripe Checkout session URL not found');
    }
    return { url: session.url, sessionId: session.id };
  }

  async createCustomerPortal(params: CreateCustomerPortalParams) {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
    return { url: session.url };
  }

  async createSubscription(params: CreateSubscriptionParams) {
    const priceId = `${params.planId}_${params.interval}`;
    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: priceId }],
      trial_period_days: params.trialDays,
      metadata: params.metadata,
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      id: subscription.id,
      status: subscription.status as SubscriptionStatus,
    };
  }

  async updateSubscription(params: UpdateSubscriptionParams) {
    const subscription = await this.stripe.subscriptions.retrieve(params.subscriptionId);
    const priceId = `${params.planId}_${params.interval}`;

    const updatedSubscription = await this.stripe.subscriptions.update(params.subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'create_prorations',
    });

    return { id: updatedSubscription.id, status: updatedSubscription.status as SubscriptionStatus };
  }

  async cancelSubscription(subscriptionId: string) {
    const cancelledSubscription = await this.stripe.subscriptions.cancel(subscriptionId);
    return { id: cancelledSubscription.id, status: cancelledSubscription.status as SubscriptionStatus };
  }

  async resumeSubscription(subscriptionId: string) {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return { id: subscription.id, status: subscription.status as SubscriptionStatus };
  }

  async getSubscription(subscriptionId: string) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    return {
      id: subscription.id,
      status: subscription.status as SubscriptionStatus,
      planId: subscription.items.data[0]?.price.id ?? '', // Simplification
    };
  }

  async listInvoices(customerId: string) {
    const invoices = await this.stripe.invoices.list({ customer: customerId, limit: 100 });
    return invoices.data.map((inv) => ({
      id: inv.id,
      status: inv.status as InvoiceStatus,
      amount: inv.amount_due,
      currency: inv.currency,
      createdAt: new Date(inv.created * 1000),
      hostedUrl: inv.hosted_invoice_url ?? undefined,
      pdfUrl: inv.invoice_pdf ?? undefined,
    }));
  }

  async createInvoice(customerId: string, amount: number, currency: string) {
    await this.stripe.invoiceItems.create({ customer: customerId, amount, currency });
    const invoice = await this.stripe.invoices.create({ customer: customerId, auto_advance: true });
    return { id: invoice.id };
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    const refund = await this.stripe.refunds.create({ payment_intent: paymentIntentId, amount });
    return { id: refund.id };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured.');
    }
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return { event: event.type, data: event.data.object as Record<string, unknown> };
  }
}

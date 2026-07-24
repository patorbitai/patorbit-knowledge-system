'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  sortOrder: number;
};

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Plan[]>('/billing/plans');
        setPlans(data);
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}/mo`;

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading plans…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Plans & Billing</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans
          .filter((p) => p.sortOrder <= 2)
          .map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 bg-card ${plan.monthlyPrice === 0 ? 'ring-2 ring-primary' : ''}`}
            >
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold mt-2">
                {plan.monthlyPrice === 0 ? 'Free' : formatPrice(plan.monthlyPrice)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full px-3 py-2 text-sm rounded-md ${plan.monthlyPrice === 0 ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
              >
                {plan.monthlyPrice === 0 ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

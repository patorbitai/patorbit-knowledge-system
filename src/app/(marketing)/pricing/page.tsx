"use client";

import { motion } from "framer-motion";

const plans = [
  { name: "Freemium", price: "$0", description: "Perfect for individuals getting started", popular: false, features: ["Create one digital identity", "Add 5 claims per month", "Basic trust scoring", "Email support"] },
  { name: "Professional", price: "$29", description: "For career professionals and recruiters", popular: true, features: ["Unlimited identities", "100 claims per month", "Advanced trust algorithms", "Priority support", "Export capabilities"] },
  { name: "Enterprise", price: "Custom", description: "For organizations at scale", popular: false, features: ["Unlimited everything", "Single sign-on", "Dedicated support", "Custom integrations", "Advanced analytics"] },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-6">Pricing</span>
              <h1 className="text-5xl font-bold text-white leading-tight mb-6">Simple, Transparent Pricing</h1>
              <p className="text-slate-400 text-lg">Choose the plan that fits your needs.</p>
            </motion.div>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-8"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">MOST POPULAR</span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                  <div className="text-4xl font-bold text-emerald-400 mb-2">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="text-lg text-slate-500">/month</span>}
                  </div>
                  <p className="text-slate-500 text-sm">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-300">{feat}</span>
                    </li>
                  ))}
                </ul>
                <div className={`w-full rounded-xl py-4 px-6 font-semibold text-center transition-all ${plan.popular ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg" : "border border-slate-700 text-slate-300 hover:border-slate-600"}`}>
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

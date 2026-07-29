"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Users, ShieldCheck, Network, Building2 } from "lucide-react";

const stats = [
  {
    value: "3.2K+",
    label: "Professionals",
    icon: Users,
    accent: "from-cyan-400/20 to-blue-500/10",
    iconColor: "text-cyan-400",
  },
  {
    value: "12K+",
    label: "Claims Verified",
    icon: ShieldCheck,
    accent: "from-blue-400/20 to-indigo-500/10",
    iconColor: "text-blue-400",
  },
  {
    value: "8K+",
    label: "Knowledge Graph Connections",
    icon: Network,
    accent: "from-indigo-400/20 to-purple-500/10",
    iconColor: "text-indigo-400",
  },
  {
    value: "120+",
    label: "Universities & Organizations",
    icon: Building2,
    accent: "from-purple-400/20 to-cyan-500/10",
    iconColor: "text-purple-400",
  },
];

function StatCard({ stat, index }: { stat: typeof stats[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = stat.icon;

  return (
    <div
      ref={ref}
      className="group relative"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.2s ease-out ${index * 0.06}s, transform 0.2s ease-out ${index * 0.06}s`,
      }}
    >
      <div className="relative h-full rounded-xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-[0_8px_32px_-8px_rgba(59,130,246,0.15)]">
        <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} transition-transform duration-150 group-hover:scale-[1.03]`}>
          <Icon className={`h-5 w-5 ${stat.iconColor}`} strokeWidth={1.75} />
        </div>
        <div className="text-3xl font-bold tracking-tight text-white tabular-nums">
          {stat.value}
        </div>
        <div className="mt-1 text-sm text-slate-400 leading-snug">
          {stat.label}
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="relative bg-[#070B14] py-24 overflow-hidden" aria-label="Platform statistics">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-radial from-blue-500/5 via-transparent to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

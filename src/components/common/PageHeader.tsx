"use client";

import { motion } from "framer-motion";

type PageHeaderProps = {
  label: string;
  title: string;
  subtitle?: string;
  gradient?: "cyan" | "emerald" | "blue" | "purple" | "amber" | "orange";
};

const gradientMap = {
  cyan: { labelBorder: "border-cyan-500/20", labelBg: "bg-cyan-500/5", labelText: "text-cyan-400", title: "text-gradient" },
  emerald: { labelBorder: "border-emerald-500/20", labelBg: "bg-emerald-500/5", labelText: "text-emerald-400", title: "text-gradient-warm" },
  blue: { labelBorder: "border-blue-500/20", labelBg: "bg-blue-500/5", labelText: "text-blue-400", title: "text-gradient" },
  purple: { labelBorder: "border-purple-500/20", labelBg: "bg-purple-500/5", labelText: "text-purple-400", title: "text-gradient-warm" },
  amber: { labelBorder: "border-amber-500/20", labelBg: "bg-amber-500/5", labelText: "text-amber-400", title: "text-gradient-warm" },
  orange: { labelBorder: "border-orange-500/20", labelBg: "bg-orange-500/5", labelText: "text-orange-400", title: "text-gradient-warm" },
};

export default function PageHeader({ label, title, subtitle, gradient = "cyan" }: PageHeaderProps) {
  const g = gradientMap[gradient];

  return (
    <section className="relative overflow-hidden border-b border-slate-800/50 py-24 md:py-28">
      <div className="absolute inset-0 bg-grid-lg" />
      <div className="absolute top-0 -left-32 w-96 h-96 rounded-full blur-[128px] opacity-30"
        style={{ background: `radial-gradient(circle, ${gradient === "cyan" || gradient === "blue" ? "rgba(6,182,212,0.15)" : "rgba(245,158,11,0.15)"}, transparent)` }}
      />
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className={`inline-block rounded-full border ${g.labelBorder} ${g.labelBg} ${g.labelText} px-4 py-1.5 text-sm font-medium backdrop-blur-sm mb-6`}>
            {label}
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {title}
          </h1>

          {subtitle && (
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

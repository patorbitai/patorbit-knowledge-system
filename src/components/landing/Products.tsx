"use client";

import { motion } from "framer-motion";

export default function Products() {
  const products = [
    {
      icon: "🎓",
      title: "Career Passport",
      description: "A living digital identity built from verified degrees, work history, and skills—accessible anywhere you prove yourself.",
      features: [
        "LinkedIn-style claims network",
        "Skills endorsements from peers",
        "Degree verification APIs",
        "Self-sovereign data control",
      ],
      color: "from-cyan-400 to-blue-400",
    },
    {
      icon: "👔",
      title: "Recruiter Workspace",
      description: "Replace résumé screening with evidence-backed candidate evaluation using transparent reasoning and confidence scoring.",
      features: [
        "Claim verification workflow",
        "Confidence scoring per claim",
        "AI reasoning explanations",
        "Bulk verification tools",
      ],
      color: "from-blue-400 to-indigo-400",
    },
    {
      icon: "🏢",
      title: "Enterprise Platform",
      description: "Connect organizational knowledge graphs for internal trust, compliance, and talent management at scale.",
      features: [
        "Knowledge graph integration",
        "Enterprise identity federation",
        "Compliance reporting",
        "Custom verification protocols",
      ],
      color: "from-indigo-400 to-purple-400",
    },
    {
      icon: "🛠️",
      title: "Developer APIs",
      description: "Embed knowledge and trust capabilities into your applications with webhook-based claim verification and evidence storage.",
      features: [
        "RESTful verification endpoints",
        "WebSocket real-time updates",
        "SDK for major languages",
        "Analytics and monitoring",
      ],
      color: "from-purple-400 to-emerald-400",
    },
  ];

  return (
    <section className="relative bg-slate-950 py-32 text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-sm font-medium text-cyan-400 backdrop-blur-sm mb-6">
              Product Suite
            </span>

            <h2 className="text-4xl font-bold md:text-5xl mb-6">
              Solutions for Every Use<br/>
              <span className="text-gradient">Case</span>
            </h2>

            <p className="text-lg text-slate-400 leading-relaxed">
              Four products that transform how trust is built, verified, and managed across personal and professional ecosystems.
            </p>
          </motion.div>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
              className="group relative h-full"
            >
              <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-cyan-500/30 hover:bg-slate-900/80">
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${product.color} text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  {product.icon}
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">{product.title}</h3>

                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {product.description}
                </p>

                <div className="space-y-3">
                  {product.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button className="mt-8 w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors">
                  Learn more
                </button>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
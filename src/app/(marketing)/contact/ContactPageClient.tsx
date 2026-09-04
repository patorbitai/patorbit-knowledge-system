"use client";

import { motion } from "framer-motion";

export function ContactPageClient() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold text-white mb-8">Get in Touch</h1>
            <p className="text-slate-400 text-lg mb-12">Have questions about Patorbit? We would love to hear from you.</p>
            <div className="grid gap-8 md:grid-cols-3 mb-16">
              {[
                { icon: "📧", title: "Email", value: "hello@patorbit.ai" },
                { icon: "📞", title: "Phone", value: "+1 (555) 123-4567" },
                { icon: "💬", title: "Chat", value: "Available 24/7" },
              ].map((c, i) => (
                <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-cyan-500/30 transition-all">
                  <div className="text-3xl mb-2">{c.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-1">{c.title}</h3>
                  <p className="text-cyan-400">{c.value}</p>
                </motion.div>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12">
              <h2 className="text-2xl font-bold text-white mb-8">Send a Message</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input placeholder="Name" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500" />
                  <input placeholder="Email" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500" />
                </div>
                <input placeholder="Subject" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500" />
                <textarea rows={5} placeholder="Message" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 resize-none" />
                <div className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-center font-semibold text-white cursor-pointer hover:from-cyan-400 hover:to-blue-400 transition-all">Talk to Our Team</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, Send, ArrowRight } from "lucide-react";

const contactMethods = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Email",
    value: "hello@patorbit.ai",
    href: "mailto:hello@patorbit.ai",
    gradient: "from-cyan-500 to-blue-500",
    description: "We typically respond within 24 hours",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    title: "Phone",
    value: "+91 9226232697",
    href: "tel:+919226232697",
    gradient: "from-emerald-500 to-green-500",
    description: "Mon–Sat, 10 AM – 7 PM IST",
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: "WhatsApp",
    value: "Chat with us",
    href: "https://wa.me/919226232697",
    gradient: "from-green-500 to-emerald-500",
    description: "Instant replies during business hours",
  },
];

export function ContactPageClient() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                Get in Touch
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
                Have questions about Patorbit? We&apos;d love to hear from you.
                Our team is ready to help you build better resumes.
              </p>
            </div>

            {/* Contact methods */}
            <div className="grid gap-6 md:grid-cols-3 mb-16">
              {contactMethods.map((method, i) => (
                <motion.a
                  key={method.title}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    {method.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{method.title}</h3>
                  <p className="text-cyan-400 text-sm font-medium group-hover:text-cyan-300 transition-colors">
                    {method.value}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">{method.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] font-medium text-slate-500 group-hover:text-cyan-400 transition-colors">
                    {method.href.startsWith("http") ? "Open WhatsApp" : "Send a message"}
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Contact form */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Send a Message</h2>
                  <p className="text-xs text-slate-400">We&apos;ll get back to you within 24 hours</p>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                    <input
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 border-transparent focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                    <input
                      placeholder="you@example.com"
                      type="email"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 border-transparent focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject</label>
                  <input
                    placeholder="How can we help?"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 border-transparent focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your question or feedback..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 resize-none border-transparent focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-400 hover:shadow-xl hover:shadow-cyan-500/30 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

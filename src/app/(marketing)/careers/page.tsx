"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CareersPage() {
  const jobs = [
    { title: "Senior Full Stack Engineer", level: "Senior", location: "Global Remote", dept: "Engineering" },
    { title: "AI/ML Engineer", level: "Senior", location: "Global Remote", dept: "Engineering" },
    { title: "Frontend Developer", level: "Mid-Senior", location: "Global Remote", dept: "Engineering" },
    { title: "Backend Engineer", level: "Mid-Senior", location: "Global Remote", dept: "Engineering" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm text-purple-400 mb-6">Careers</span>
              <h1 className="text-5xl font-bold text-white mb-6">Join Our Team</h1>
              <p className="text-slate-400 text-lg">Help us build the future of digital trust.</p>
            </motion.div>
          </div>
          <div className="mt-20 space-y-6">
            {jobs.map((job, i) => (
              <motion.div key={job.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{job.title}</h2>
                    <div className="flex gap-3 mt-2 text-sm text-slate-500">
                      <span className="text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">{job.level}</span>
                      <span>{job.location}</span>
                      <span>{job.dept}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white">Apply</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Didn&apos;t find the right role?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                We&apos;re always looking for great people. Send us your resume and we&apos;ll keep you in mind.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-150 hover:from-purple-400 hover:to-pink-500 hover:shadow-purple-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}

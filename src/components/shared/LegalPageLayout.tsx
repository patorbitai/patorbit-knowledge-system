"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/* ─── Constants ─── */
export const COMPANY_NAME = "Patorbit";
export const CONTACT_EMAIL = "legal@patorbit.ai";

/* ─── Shared typography ─── */
export const legalTypography = {
  body: "text-slate-300 leading-relaxed",
  sectionTitle: "text-xl font-semibold text-white mb-3",
  list: "list-disc list-inside space-y-2 text-slate-400",
};

/* ─── Reusable section component ─── */
export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className={legalTypography.sectionTitle}>
        <span className="text-cyan-400 font-medium mr-2">{number}.</span>
        {title}
      </h2>
      <div className={legalTypography.body}>{children}</div>
    </section>
  );
}

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  effectiveDate: string;
  version: string;
  children: React.ReactNode;
  underDevelopment?: boolean;
}

export default function LegalPageLayout({
  title,
  description,
  lastUpdated,
  effectiveDate,
  version,
  children,
  underDevelopment = false,
}: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 tracking-wide uppercase font-medium">
                {COMPANY_NAME} · Legal & Trust
              </span>
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">{title}</h1>

            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {underDevelopment && (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Under Active Development
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-400">
                Last Updated: {lastUpdated}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-400">
                Effective: {effectiveDate}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-400">
                Version: {version}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 lg:p-12 space-y-10"
          >
            {children}
          </motion.div>

          <div className="mt-12 flex flex-col items-center gap-3 text-sm text-slate-500">
            <p>
              Questions about this document? Contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              or via our contact page
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
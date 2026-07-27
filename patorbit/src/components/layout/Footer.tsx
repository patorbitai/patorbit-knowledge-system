"use client";

import Link from "next/link";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { href: "/career-passport", label: "Career Passport" },
      { href: "/trust-verification", label: "Trust Verification" },
      { href: "/knowledge-graph", label: "Knowledge Graph" },
      { href: "/enterprise", label: "Enterprise Suite" },
      { href: "/api-access", label: "API Access" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/blog", label: "Blog" },
      { href: "/press", label: "Press" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/api-reference", label: "API Reference" },
      { href: "/developers", label: "Developers" },
      { href: "/security", label: "Security" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/security", label: "Security" },
      { href: "/compliance", label: "Compliance" },
      { href: "/license", label: "License" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-14 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-lg font-semibold text-white">Patorbit</span>
          </Link>

          <div className="flex gap-6">
            <a href="https://twitter.com/patorbit" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all">
              Twitter
            </a>
            <a href="https://github.com/patorbit" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all">
              GitHub
            </a>
            <a href="https://linkedin.com/company/patorbit" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all">
              LinkedIn
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-slate-600">© 2026 Patorbit AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-500">All systems operational</span>
              </div>
              <span className="text-xs text-slate-600">v0.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

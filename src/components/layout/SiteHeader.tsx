"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const navLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_40px_-15px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* ── Logo ── */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-lg shadow-cyan-500/20 transition-all duration-300 group-hover:shadow-cyan-400/40 group-hover:scale-105">
            <span className="text-sm font-bold text-white drop-shadow-sm">P</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white/90 transition-colors duration-300 group-hover:text-white">
            Patorbit
          </span>
        </Link>

        {/* ── Desktop Navigation ── */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
          <div className="flex items-center gap-0.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] px-1.5 py-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-white/[0.07] border border-white/[0.08] shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Actions & Mobile Toggle ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="relative hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white hover:bg-white/[0.06]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-400/40 hover:scale-105 active:scale-[1.02]"
          >
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">Get Started</span>
          </Link>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:bg-white/[0.06]"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col items-center justify-center gap-[4px]">
              <motion.span
                animate={isOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                className="h-[1.5px] w-5 bg-slate-300 block origin-center transition-colors"
              />
              <motion.span
                animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                className="h-[1.5px] w-5 bg-slate-300 block transition-colors"
              />
              <motion.span
                animate={isOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                className="h-[1.5px] w-5 bg-slate-300 block origin-center transition-colors"
              />
            </div>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-white/[0.06] bg-slate-950/95 backdrop-blur-2xl"
          >
            <div className="px-6 py-5 space-y-1">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200",
                        isActive
                          ? "bg-white/[0.06] text-white"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      )}
                    >
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                      )}
                      {!isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white/[0.08] shrink-0" />
                      )}
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05 + 0.05, duration: 0.2 }}
                className="!mt-6 border-t border-white/[0.06] pt-4"
              >
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-xl px-4 py-3 text-base font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

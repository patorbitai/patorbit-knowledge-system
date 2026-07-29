"use client";

import { motion, type Variants } from "framer-motion";
import { clsx } from "clsx";
import { useRef, useEffect, useState } from "react";

/* ── Page Transition ── */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger children ── */
export function StaggerContainer({
  children,
  delay = 0.03,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const variants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger item ── */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const variants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Fade in on scroll ── */
export function FadeInView({
  children,
  className,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Scale in ── */
export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Skeleton loader ── */
export function Skeleton({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={clsx("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-white/[0.04] animate-skeleton"
          style={{ width: `${95 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

/* ── Skeleton card ── */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-white/[0.04] animate-skeleton" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-1/3 rounded-lg bg-white/[0.04] animate-skeleton" />
          <div className="h-3 w-1/2 rounded-lg bg-white/[0.04] animate-skeleton" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-lg bg-white/[0.04] animate-skeleton" />
        <div className="h-3 w-4/5 rounded-lg bg-white/[0.04] animate-skeleton" />
        <div className="h-3 w-3/5 rounded-lg bg-white/[0.04] animate-skeleton" />
      </div>
    </div>
  );
}

/* ── AI Thinking indicator ── */
export function AIThinking({ label = "AI is thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/8 border border-blue-500/15">
      <div className="flex items-center gap-0.5">
        <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-blue-400" />
        <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-blue-400" />
        <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-blue-400" />
      </div>
      <span className="text-[10px] text-blue-400 font-medium">{label}</span>
    </div>
  );
}

/* ── Counter animation ── */
export function AnimatedCounter({
  value,
  duration = 1.2,
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          function animate(time: number) {
            const elapsed = time - start;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {displayed}{suffix}
    </span>
  );
}

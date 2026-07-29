"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export default function GlowCard({ children, className = "", index = 0 }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className={`group rounded-xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-6 lg:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-[0_0_30px_-10px_rgba(0,212,255,0.15)] ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.4s ease-out ${index * 0.05}s, transform 0.4s ease-out ${index * 0.05}s, border-color 0.3s, box-shadow 0.3s`,
      }}
    >
      {children}
    </div>
  );
}

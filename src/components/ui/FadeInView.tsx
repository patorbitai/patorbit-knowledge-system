"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export default function FadeInView({
  children,
  className = "",
  delay = 0,
  y = 20,
}: FadeInViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.4s ease-out ${delay}s, transform 0.4s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

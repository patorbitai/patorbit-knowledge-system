"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";

interface SectionContentProps {
  children: React.ReactNode;
  isCollapsed?: boolean;
  className?: string;
}

export function SectionContent({ children, isCollapsed, className }: SectionContentProps) {
  if (isCollapsed) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={clsx("space-y-4", className)}
    >
      {children}
    </motion.div>
  );
}

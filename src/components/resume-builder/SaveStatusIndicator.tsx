"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, CloudLightning, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";

const indicators = {
  saved: {
    text: "Saved",
    subtext: "All changes saved",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: Cloud,
  },
  saving: {
    text: "Saving...",
    subtext: "Syncing to cloud",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Loader2,
  },
  unsaved: {
    text: "Unsaved",
    subtext: "Changes pending",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: CloudOff,
  },
  "cloud-synced": {
    text: "Cloud Synced",
    subtext: "Synced to cloud",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: CloudLightning,
  },
};

export function SaveStatusIndicator() {
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const config = indicators[saveStatus];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={saveStatus}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className={clsx(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors",
          config.bg,
          config.border,
        )}
      >
        <Icon className={clsx("w-3 h-3", config.color, saveStatus === "saving" && "animate-spin")} />
        <div className="flex flex-col">
          <span className={clsx("text-[10px] font-semibold leading-tight", config.color)}>
            {config.text}
          </span>
          <span className="text-[8px] text-slate-500 leading-tight">{config.subtext}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

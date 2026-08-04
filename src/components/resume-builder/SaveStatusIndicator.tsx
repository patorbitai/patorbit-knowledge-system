"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, CloudLightning, Loader2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
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
  offline: {
    text: "Offline",
    subtext: "No internet connection",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: CloudOff,
  },
  "sync-failed": {
    text: "Sync Failed",
    subtext: "Could not save changes",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: AlertCircle,
  },
};

export function SaveStatusIndicator() {
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const setSaveStatus = useResumeBuilder((s) => s.setSaveStatus);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (saveStatus === "offline") {
        setSaveStatus("unsaved"); // Trigger a re-sync
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveStatus, setSaveStatus]);

  const currentStatus = isOnline ? saveStatus : "offline";
  const config = indicators[currentStatus];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStatus}
        initial={{ opacity: 0, y: currentStatus === "sync-failed" ? 0 : -4 }}
        animate={{
          opacity: 1,
          y: 0,
          x: currentStatus === "sync-failed" ? [-3, 3, -3, 3, 0] : 0,
        }}
        exit={{ opacity: 0, y: 4 }}
        transition={{
          duration: currentStatus === "sync-failed" ? 0.3 : 0.15,
          ease: "easeOut"
        }}
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

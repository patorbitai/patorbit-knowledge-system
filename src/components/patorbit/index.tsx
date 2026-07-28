"use client";

import React from "react";
import { clsx } from "clsx";

/* ── Layout ── */
export function AppLayout({ children, sidebar }: { children: React.ReactNode; sidebar?: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-5">
          {sidebar && <aside className="hidden lg:block w-[220px] shrink-0">{sidebar}</aside>}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}

/* ── PageHeader ── */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── FormCard ── */
export function FormCard({ title, subtitle, children, className }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("bg-[#0F1629] rounded-2xl border border-white/[0.06] p-6 shadow-xl", className)}>
      {title && <h2 className="text-base font-semibold text-white mb-1">{title}</h2>}
      {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

/* ── EntityCard ── */
export function EntityCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all", className)}>
      {children}
    </div>
  );
}

/* ── Input ── */
export function Input({ icon, value, onChange, onBlur, placeholder, type = "text", error, className }: {
  icon?: React.ReactNode; value: string; onChange: (v: string) => void; onBlur?: () => void;
  placeholder?: string; type?: string; error?: string; className?: string;
}) {
  const sanitize = (val: string) => {
    switch (type) {
      case "name": return val.replace(/[^a-zA-Z\s'-]/g, "");
      case "tel": return val.replace(/[^0-9()+\-\s]/g, "");
      case "email": return val.replace(/[^a-zA-Z0-9@._+\-]/g, "");
      default: return val;
    }
  };
  return (
    <div className={className}>
      <div className="relative group">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60 group-focus-within:opacity-100 transition-opacity">{icon}</span>}
        <input type={type === "name" ? "text" : type} value={value || ""} onChange={e => onChange(sanitize(e.target.value))} onBlur={onBlur}
          className={clsx("w-full bg-white/[0.04] border rounded-xl text-sm text-white focus:ring-1 focus:outline-none placeholder:text-slate-500 transition-all",
            icon ? "pl-10 pr-3.5 py-2.5" : "px-4 py-2.5",
            error ? "border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20" : "border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/20")}
          placeholder={placeholder} autoComplete="off" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ── Select ── */
export function Select({ value, onChange, options, placeholder, className }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
  placeholder?: string; className?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={clsx("w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none px-4 py-2.5 appearance-none cursor-pointer", className)}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ── StatusBadge ── */
const statusColors: Record<string, string> = {
  completed: "text-emerald-400 bg-emerald-500/15",
  saved: "text-emerald-400 bg-emerald-500/15",
  saving: "text-amber-400 bg-amber-500/15",
  unsaved: "text-slate-500 bg-white/[0.05]",
  pending: "text-slate-400 bg-white/[0.05]",
  in_progress: "text-blue-400 bg-blue-500/15",
  error: "text-red-400 bg-red-500/15",
  verified: "text-emerald-400 bg-emerald-500/15",
  unverified: "text-amber-400 bg-amber-500/15",
};
export function StatusBadge({ status, children }: { status: string; children?: React.ReactNode }) {
  return (
    <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-medium", statusColors[status] || "text-slate-500 bg-white/[0.05]")}>
      {children || status}
    </span>
  );
}

/* ── ProgressStepper ── */
export function ProgressStepper({ steps, activeIndex, completedIndex }: { steps: { id: string; label: string; icon: string }[]; activeIndex: number; completedIndex: number }) {
  return (
    <nav className="space-y-[2px]">
      {steps.map((s, idx) => {
        const isActive = idx === activeIndex;
        const isCompleted = idx <= completedIndex;
        return (
          <button key={s.id} className={clsx("relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left group",
            isActive ? "bg-blue-500/15 border border-blue-500/25" : "hover:bg-white/[0.04] border border-transparent")}>
            <div className={clsx("relative z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all shrink-0",
              isActive ? "bg-blue-500 border-blue-500 scale-110" : isCompleted ? "bg-emerald-500/20 border-emerald-500/40" : "bg-white/[0.04] border-white/[0.08]")}>
              {isCompleted ? <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : <span className="text-[10px]" style={{ color: isActive ? "white" : undefined }}>{s.icon}</span>}
            </div>
            <span className={clsx("text-sm font-medium truncate", isActive ? "text-white" : "text-slate-400")}>{s.label}</span>
            {isActive && <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0" />}
          </button>
        );
      })}
    </nav>
  );
}

/* ── ConfirmationDialog ── */
export function ConfirmationDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "danger", onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string;
  variant?: "danger" | "primary"; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  const confirmColor = variant === "danger" ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onCancel}>
      <div className="bg-[#0F1629] border border-white/[0.08] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
        <p className="text-xs text-slate-400 mb-5">{message}</p>
        <div className="flex gap-2.5 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] text-xs font-medium transition-all">{cancelLabel}</button>
          <button onClick={onConfirm} className={clsx("px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all", confirmColor)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ── ActionToolbar ── */
export function ActionToolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

/* ── SectionStepper ── */
export function SectionStepper({ sections, activeSection }: { sections: { id: string; label: string; icon: string }[]; activeSection: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-none">
      {sections.map(s => {
        const isActive = activeSection === s.id;
        return (
          <button key={s.id} className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            isActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]")}>
            {s.icon} {s.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── SkillSelector ── */
export function SkillSelector({ skills, onChange }: { skills: { id: number; name: string; level: string; years?: string }[]; onChange?: (skills: any[]) => void }) {
  return (
    <div className="space-y-2">
      {skills.map(s => (
        <div key={s.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
          <span className="text-sm text-white">{s.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{s.level}</span>
            {s.years && <span className="text-[10px] text-slate-500">{s.years}y</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

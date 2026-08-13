"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function AccountMenu() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden min-w-0 flex-1 md:block">
          <span className="block truncate text-xs font-medium text-white">{name}</span>
          <span className="block truncate text-[11px] text-slate-500">{email}</span>
        </span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 md:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/[0.06] bg-[#080C18] shadow-2xl"
        >
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-[11px] text-slate-500">{email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.05]"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-cyan-400" />}
            {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

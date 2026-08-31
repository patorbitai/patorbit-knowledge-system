"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  Palette,
  Settings,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRIMARY_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/overview", icon: LayoutDashboard },
  { label: "Resumes", href: "/resume-builder", icon: FileText },
  { label: "Templates", href: "/resume-builder", icon: Palette },
];

const SECONDARY_ITEMS: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/resume-builder") {
      return pathname === "/resume-builder" || pathname.startsWith("/resume-builder/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#070d18] text-gray-600 dark:text-[#a7bad3]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Go to Patorbit home"
          className="flex items-center gap-3 rounded-xl px-2 py-1 transition-all hover:bg-gray-100 dark:hover:bg-white/[0.04] group w-full"
        >
          <div className="h-[38px] w-[38px] rounded-[12px] bg-gradient-to-br from-[#08c9ee] to-[#7355ff] shadow-[0_8px_24px_rgba(59,130,246,.18)] flex items-center justify-center font-black text-white text-base transition-transform group-hover:scale-105 shrink-0">
            P
          </div>
          <span className="text-[21px] font-extrabold tracking-tight text-gray-900 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors">
            Patorbit
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 font-sans">
        <ul className="space-y-0.5">
          {PRIMARY_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={label}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-blue-50 dark:bg-gradient-to-r dark:from-[rgba(14,165,233,.18)] dark:to-[rgba(59,130,246,.08)] text-blue-600 dark:text-white shadow-[inset_3px_0_0] shadow-blue-500 dark:shadow-[#22d3ee]"
                      : "text-gray-500 dark:text-[#a7bad3] hover:bg-gray-50 dark:hover:bg-[rgba(14,165,233,.10)] hover:text-gray-900 dark:hover:text-[#f8fafc]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-3 border-t border-gray-200 dark:border-white/[0.06]" />

        {/* Secondary nav */}
        <ul className="space-y-0.5">
          {SECONDARY_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={label}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-blue-50 dark:bg-gradient-to-r dark:from-[rgba(14,165,233,.18)] dark:to-[rgba(59,130,246,.08)] text-blue-600 dark:text-white shadow-[inset_3px_0_0] shadow-blue-500 dark:shadow-[#22d3ee]"
                      : "text-gray-500 dark:text-[#a7bad3] hover:bg-gray-50 dark:hover:bg-[rgba(14,165,233,.10)] hover:text-gray-900 dark:hover:text-[#f8fafc]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[11px] text-gray-400 dark:text-slate-600 text-center">
          Auto-saving enabled
        </p>
      </div>
    </div>
  );
}

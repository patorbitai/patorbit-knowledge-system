"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  Palette,
  Sparkles,
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
  { label: "AI Workspace", href: "/ai", icon: Sparkles },
  { label: "Templates", href: "/templates", icon: Palette },
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
    <div className="flex h-full flex-col bg-white dark:bg-[#080C18]">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Go to Patorbit home"
          className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04] group"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#08c9ee] to-[#0ea5e9] flex items-center justify-center text-[13px] font-bold text-white shrink-0">
            P
          </div>
          <span className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-white">
            Patorbit
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 font-sans">
        <ul className="space-y-0.5">
          {PRIMARY_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={label}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-gray-100 dark:bg-white/[0.07] text-gray-900 dark:text-white border-l-[2.5px] border-cyan-500 dark:border-cyan-400 pl-[9px]"
                      : "text-gray-500 dark:text-[#8e99af] hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-800 dark:hover:text-[#cbd5e1]"
                  )}
                >
                  <Icon className={clsx("h-4 w-4 shrink-0", active && "text-cyan-600 dark:text-cyan-400")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings pinned to bottom */}
      <div className="px-3 pb-1">
        <div className="mb-2 border-t border-gray-100 dark:border-white/[0.05]" />
        <ul className="space-y-0.5">
          {SECONDARY_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={label}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-gray-100 dark:bg-white/[0.07] text-gray-900 dark:text-white border-l-[2.5px] border-cyan-500 dark:border-cyan-400 pl-[9px]"
                      : "text-gray-500 dark:text-[#8e99af] hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-800 dark:hover:text-[#cbd5e1]"
                  )}
                >
                  <Icon className={clsx("h-4 w-4 shrink-0", active && "text-cyan-600 dark:text-cyan-400")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-[#64748b]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
          Auto-saving
        </div>
      </div>
    </div>
  );
}

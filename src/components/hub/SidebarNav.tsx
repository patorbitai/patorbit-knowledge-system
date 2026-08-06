"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  IdCard,
  ShieldCheck,
  Gauge,
  BadgeCheck,
  FileSearch,
  History,
  Sparkles,
  Bot,
  Target,
  Lightbulb,
  Network,
  Map,
  Briefcase,
  Settings,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
};

type NavGroup = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    label: "Trust",
    href: "/trust",
    icon: ShieldCheck,
    children: [
      { label: "Trust Score", href: "/trust", icon: Gauge, disabled: true },
      { label: "Credential Verification", href: "/trust", icon: BadgeCheck, disabled: true },
      { label: "Evidence Explorer", href: "/trust", icon: FileSearch, disabled: true },
      { label: "Trust Timeline", href: "/trust", icon: History, disabled: true },
    ],
  },
  {
    label: "AI",
    href: "/ai",
    icon: Sparkles,
    children: [
      { label: "Career Copilot", href: "/ai", icon: Bot, disabled: true },
      { label: "Resume Analysis", href: "/ai", icon: FileText, disabled: true },
      { label: "Job Match", href: "/ai", icon: Target, disabled: true },
      { label: "Career Insights", href: "/ai", icon: Lightbulb, disabled: true },
    ],
  },
  {
    label: "Network",
    href: "/network",
    icon: Network,
    children: [
      { label: "Knowledge Graph", href: "/network", icon: Network, disabled: true },
      { label: "Career Journey", href: "/network", icon: Map, disabled: true },
      { label: "Applications", href: "/network", icon: Briefcase, disabled: true },
    ],
  },
];

const SINGLE_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Passport", href: "/passport", icon: IdCard },
];

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <span className="text-base font-semibold tracking-tight text-white">
          Patorbit
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {/* Single items */}
        <ul className="space-y-1">
          {SINGLE_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-cyan-500/10 text-cyan-300"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Groups */}
        {GROUPS.map((group) => {
          const active = isActive(group.href);
          return (
            <div key={group.label}>
              <Link
                href={group.href}
                onClick={onNavigate}
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                )}
              >
                <group.icon className="h-4 w-4 shrink-0" />
                {group.label}
              </Link>
              <ul className="mt-1 space-y-1">
                {group.children.map(({ label, icon: Icon, badge }) => (
                  <li key={label}>
                    <span className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 pl-10 text-[13px] text-slate-600">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {badge ? (
                        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {badge}
                        </span>
                      ) : (
                        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Soon
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Settings */}
        <ul className="space-y-1">
          <li>
            <Link
              href="/settings"
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/settings")
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {session?.user?.name || "User"}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
            className="text-slate-500 transition-colors hover:text-rose-400"
          >
            <span className="text-[11px] font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

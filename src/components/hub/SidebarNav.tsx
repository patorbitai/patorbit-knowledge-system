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
      { label: "Trust Score", href: "/trust", icon: Gauge },
      { label: "Credential Verification", href: "/trust/verification", icon: BadgeCheck },
      { label: "Evidence Explorer", href: "/trust/evidence", icon: FileSearch },
      { label: "Trust Timeline", href: "/trust/timeline", icon: History },
    ],
  },
  {
    label: "AI",
    href: "/ai",
    icon: Sparkles,
    children: [
      { label: "Career Copilot", href: "/ai", icon: Bot, disabled: true, badge: "SOON" },
      { label: "Resume Analysis", href: "/ai", icon: FileText, disabled: true, badge: "SOON" },
      { label: "Job Match", href: "/ai", icon: Target, disabled: true, badge: "SOON" },
      { label: "Career Insights", href: "/ai", icon: Lightbulb, disabled: true, badge: "SOON" },
    ],
  },
  {
    label: "Network",
    href: "/network",
    icon: Network,
    children: [
      { label: "Knowledge Graph", href: "/network/graph", icon: Network },
      { label: "Career Journey", href: "/network/journey", icon: Map },
      { label: "Applications", href: "/network", icon: Briefcase, disabled: true, badge: "SOON" },
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const isItemActive = (href: string) => {
    if (href === "/trust") {
      return pathname === "/trust";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isGroupActive = (groupHref: string) => {
    return pathname === groupHref || pathname.startsWith(groupHref + "/");
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#07101e] to-[#050a13] text-[#a7bad3]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Go to Patorbit home"
          className="flex items-center gap-3 rounded-xl px-2 py-1 transition-all hover:bg-white/[0.04] group w-full"
        >
          <div className="h-[38px] w-[38px] rounded-[12px] bg-gradient-to-br from-[#08c9ee] to-[#7355ff] shadow-[0_8px_24px_rgba(59,130,246,.18)] flex items-center justify-center font-black text-white text-base transition-transform group-hover:scale-105 shrink-0">
            P
          </div>
          <span className="text-[21px] font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            Patorbit
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-2 font-sans">
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
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-[rgba(14,165,233,.18)] to-[rgba(59,130,246,.08)] text-white shadow-[inset_2px_0_#22d3ee]"
                      : "text-[#a7bad3] hover:bg-[rgba(14,165,233,.10)] hover:text-[#f8fafc]"
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
          const active = isGroupActive(group.href);
          return (
            <div key={group.label} className="space-y-1 pt-3">
              <div className="px-3 pb-1 text-[#dbeafe] text-[13px] font-bold tracking-wide">
                {group.label}
              </div>
              <ul className="space-y-1">
                {group.children.map(({ label, href, icon: Icon, badge, disabled }) => (
                  <li key={label}>
                    {disabled ? (
                      <span className="flex items-center gap-2.5 rounded-lg px-3 py-2 pl-4 text-[13px] text-slate-500 cursor-not-allowed">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="rounded-md bg-[#182235] px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-[#94a3b8]">
                            {badge}
                          </span>
                        )}
                      </span>
                    ) : (
                      <Link
                        href={href || group.href}
                        onClick={onNavigate}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2.5 pl-4 text-[13px] font-medium transition-all",
                          isItemActive(href || group.href)
                            ? "bg-gradient-to-r from-[rgba(14,165,233,.18)] to-[rgba(59,130,246,.08)] text-white shadow-[inset_2px_0_#22d3ee]"
                            : "text-[#a7bad3] hover:bg-[rgba(14,165,233,.10)] hover:text-[#f8fafc]"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="rounded-md bg-[#182235] px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-[#94a3b8]">
                            {badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Settings */}
        <div className="space-y-1 pt-3">
          <div className="px-3 pb-1 text-[#dbeafe] text-[13px] font-bold tracking-wide">
            Settings
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                href="/settings"
                onClick={onNavigate}
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive("/settings")
                    ? "bg-gradient-to-r from-[rgba(14,165,233,.18)] to-[rgba(59,130,246,.08)] text-white shadow-[inset_2px_0_#22d3ee]"
                    : "text-[#a7bad3] hover:bg-[rgba(14,165,233,.10)] hover:text-[#f8fafc]"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}

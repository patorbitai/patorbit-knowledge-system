"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  UserRound,
  Briefcase,
  FileText,
  Sparkles,
  Palette,
  Settings,
  HelpCircle,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

/* Primary navigation answers "where am I?" in one glance (§7).
   Secondary tools sit in their own group so the core journey —
   Overview → Profile → Jobs → Resumes — reads first. */
const PRIMARY_ITEMS: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Profile", href: "/passport", icon: UserRound },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Resumes", href: "/resume-builder", icon: FileText },
];

const WORKSPACE_ITEMS: NavItem[] = [
  { label: "AI Workspace", href: "/ai", icon: Sparkles },
  { label: "Templates", href: "/templates", icon: Palette },
];

const SECONDARY_ITEMS: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/docs", icon: HelpCircle },
];

function NavItemLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { label, href, icon: Icon } = item;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-body font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
        active
          ? "bg-brand-soft text-ink"
          : "text-ink-secondary hover:bg-white/[0.05] hover:text-ink"
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-pill bg-brand"
        />
      )}
      <Icon
        className={clsx(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-brand" : "text-ink-muted group-hover:text-ink-secondary"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label?: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      {label && (
        <p className="mb-1 px-3 text-meta font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.href === "/resume-builder"
              ? pathname === "/resume-builder" ||
                pathname.startsWith("/resume-builder/")
              : item.href === "/jobs"
                ? pathname === "/jobs" || pathname.startsWith("/jobs/")
                : item.href === "/passport"
                  ? pathname === "/passport"
                  : pathname === item.href ||
                    pathname.startsWith(item.href + "/");
          return (
            <li key={item.label}>
              <NavItemLink
                item={item}
                active={active}
                onNavigate={onNavigate}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <Link
          href="/home"
          onClick={onNavigate}
          aria-label="Go to Patorbit home"
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors hover:bg-white/[0.05] group"
        >
          <div className="h-7 w-7 rounded-md bg-brand flex items-center justify-center text-[13px] font-bold text-brand-contrast shrink-0">
            P
          </div>
          <span className="text-card font-semibold tracking-tight text-ink">
            Patorbit
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3">
        <NavGroup
          items={PRIMARY_ITEMS}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavGroup
          label="Workspace"
          items={WORKSPACE_ITEMS}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      {/* Secondary nav pinned to bottom */}
      <div className="px-3 pb-3 pt-2">
        <div className="mb-2 border-t border-subtle" />
        <NavGroup
          items={SECONDARY_ITEMS}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

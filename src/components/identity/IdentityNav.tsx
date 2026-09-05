"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ShieldCheck, Network, FileText, Route, ArrowLeft } from "lucide-react";

const NAV_ITEMS = [
  { href: "/trust", label: "Trust Score", icon: ShieldCheck, desc: "Verification & credibility" },
  { href: "/network", label: "Knowledge Graph", icon: Network, desc: "Professional relationships" },
  { href: "/network/journey", label: "Career Journey", icon: Route, desc: "Career progression" },
  { href: "/trust/evidence", label: "Evidence", icon: FileText, desc: "Supporting documents" },
];

export function IdentityNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-3" aria-label="Professional Identity navigation">
      <Link
        href="/overview"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Dashboard
      </Link>

      <div className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                isActive
                  ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30"
                  : "bg-white dark:bg-white/[0.03] text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] hover:text-gray-900 dark:hover:text-white",
              )}
            >
              <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-gray-400 dark:text-slate-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

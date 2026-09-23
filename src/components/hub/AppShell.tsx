"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home } from "lucide-react";
import SidebarNav from "./SidebarNav";
import AccountMenu from "./AccountMenu";

/**
 * Authenticated app shell (§7): one clear sidebar, one slim top bar,
 * content scrolls in its own column. Mobile gets a drawer + hamburger.
 */
export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-sunken text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-subtle lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-subtle bg-surface shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-subtle bg-surface px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/home"
              aria-label="Go to Patorbit home"
              className="flex items-center gap-2 lg:hidden"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-brand-contrast">
                P
              </span>
              <span className="text-body font-semibold text-ink">Patorbit</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-label font-medium text-ink-secondary transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <AccountMenu />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto relative z-0">{children}</main>
      </div>
    </div>
  );
}

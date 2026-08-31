"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import SidebarNav from "./SidebarNav";
import AccountMenu from "./AccountMenu";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#070911] text-gray-600 dark:text-slate-300">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#080C18] lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#080C18] shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
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
        <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#070911]/95 px-4 backdrop-blur lg:px-6 overflow-visible">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white lg:hidden">
              Patorbit
            </span>
          </div>

          <div className="flex items-center gap-3">
            <AccountMenu />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto relative z-0">{children}</main>
      </div>
    </div>
  );
}

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
    <div className="flex h-screen overflow-hidden bg-[#070911] text-slate-300">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-[#080C18] lg:block">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/[0.06] bg-[#080C18] shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.05] hover:text-white"
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
        <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#070911]/95 px-4 backdrop-blur lg:px-6 overflow-visible">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.05] hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
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

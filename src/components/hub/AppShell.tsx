"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, FileText } from "lucide-react";
import SidebarNav from "./SidebarNav";
import { useSession } from "next-auth/react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

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
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#070911]/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.05] hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/resume-builder"
              className="hidden items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-300 sm:inline-flex"
            >
              <FileText className="h-3.5 w-3.5" />
              Resume Builder
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 md:block">
              Welcome back, {session?.user?.name?.split(" ")[0] || "there"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
              {(session?.user?.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

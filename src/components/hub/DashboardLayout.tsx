"use client";

import AppShell from "./AppShell";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto px-6 pb-8 lg:pl-8">
        {children}
      </main>
    </AppShell>
  );
}
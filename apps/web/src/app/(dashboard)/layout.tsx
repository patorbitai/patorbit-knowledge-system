'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-provider';

// ── Nav item type ───────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '◆' },
  { label: 'Resumes', href: '/resumes', icon: '📄' },
  { label: 'Claims', href: '/claims', icon: '◎' },
  { label: 'Profile', href: '/profile', icon: '👤' },
  { label: 'Career Passport', href: '/career-passport', icon: '🛂' },
  { label: 'Organizations', href: '/organizations', icon: '🏢' },
  { label: 'Workspaces', href: '/workspaces', icon: '📋' },
];

// ── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <span className="w-5 text-center shrink-0">{item.icon}</span>
      {item.label}
    </Link>
  );
}

// ── Layout ──────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/sign-in');
    }
  }, [isLoading, user, router]);

  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1 rounded hover:bg-accent"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle navigation menu"
            >
              <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
            </button>

            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Patorbit
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
            <button
              onClick={async () => {
                await logout();
                router.replace('/sign-in');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* ── Sidebar (desktop) ──────────────────────────── */}
        <aside className="hidden md:block w-56 shrink-0 border-r min-h-[calc(100vh-3.5rem)] p-4 sticky top-14 self-start">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
            ))}
          </nav>
        </aside>

        {/* ── Mobile nav overlay ─────────────────────────── */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-20 bg-black/20 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="fixed left-0 top-14 bottom-0 z-20 w-56 border-r bg-card p-4 md:hidden">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* ── Main content ──────────────────────────────── */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

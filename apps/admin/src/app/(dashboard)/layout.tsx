'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/organizations', label: 'Organizations', icon: '🏢' },
  { href: '/subscriptions', label: 'Subscriptions', icon: '💳' },
  { href: '/plans', label: 'Plans', icon: '💰' },
  { href: '/audit-logs', label: 'Audit Logs', icon: '📜' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
      }`}
    >
      <span className="w-5 text-center">{icon}</span>
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/dashboard" className="font-bold text-lg">
            Patorbit Admin
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm">admin@patorbit.com</span>
            <button className="text-sm text-muted-foreground hover:text-foreground">
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <div className="flex max-w-7xl mx-auto">
        <aside className="w-56 shrink-0 border-r min-h-[calc(100vh-4rem)] p-4 sticky top-16 self-start">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

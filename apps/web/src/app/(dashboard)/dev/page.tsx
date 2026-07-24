'use client';

import { cn } from '@patorbit/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

if (process.env.NODE_ENV !== 'development') {
  throw new Error('Dev mode is only available in development');
}

// ── Types ───────────────────────────────────────────────────────────────────

type ServiceStatus = 'online' | 'offline' | 'loading';

interface Service {
  key: string;
  label: string;
  status: ServiceStatus;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ServiceStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  loading: 'Loading...',
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-red-500',
  loading: 'bg-muted-foreground/40',
};

// ── Section Components ──────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function StatusIndicator({ status }: { status: ServiceStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={cn('inline-block h-2 w-2 rounded-full', STATUS_COLORS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function DevPageSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-72 bg-muted rounded" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-full bg-muted rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page Component ──────────────────────────────────────────────────────────

const DEFAULT_SERVICES: Service[] = [
  { key: 'web', label: 'Web', status: 'online' },
  { key: 'api', label: 'API', status: 'loading' },
  { key: 'database', label: 'Database', status: 'loading' },
  { key: 'authentication', label: 'Authentication', status: 'loading' },
  { key: 'ai', label: 'AI', status: 'loading' },
  { key: 'billing', label: 'Billing', status: 'loading' },
];

const APP_PAGES = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Profile', href: '/profile' },
  { label: 'Resumes', href: '/resumes' },
  { label: 'Career Passport', href: '/career-passport' },
  { label: 'Claims', href: '/claims' },
  { label: 'Organizations', href: '/organizations' },
  { label: 'Workspaces', href: '/workspaces' },
  { label: 'Sign In', href: '/sign-in' },
];

const DOC_LINKS = [
  { label: 'Architecture Decisions', href: '/specifications/adr' },
  { label: 'Deployment Guide', href: '/specifications/deployment-guide.md' },
  { label: 'Runbook', href: '/specifications/runbook.md' },
  { label: 'Recovery Guide', href: '/specifications/recovery-guide.md' },
];

type ServiceHealth = Record<string, 'up' | 'down'>;

export default function DevPage() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get<{
          status: string;
          info?: Record<string, { status: string }>;
        }>('/health');

        const info: ServiceHealth = {};
        if (res?.info) {
          for (const [key, val] of Object.entries(res.info)) {
            info[key] = val.status === 'up' ? 'up' : 'down';
          }
        }

        setServices((prev) =>
          prev.map((svc) => {
            if (svc.key === 'web') return { ...svc, status: 'online' };

            const mapped =
              svc.key === 'api'
                ? 'api'
                : svc.key === 'database'
                  ? 'database'
                  : svc.key === 'authentication'
                    ? 'auth'
                    : svc.key;

            const isUp = res.status === 'ok' && info[mapped] === 'up';
            // For services not in health check response, assume online if API is up
            const isOnline =
              res.status === 'ok' && (info[mapped] === 'up' || info[mapped] === undefined);

            return {
              ...svc,
              status: isUp || isOnline ? 'online' : ('offline' as ServiceStatus),
            };
          }),
        );
      } catch {
        setServices((prev) =>
          prev.map((svc) => ({
            ...svc,
            status: 'offline' as ServiceStatus,
          })),
        );
      } finally {
        setIsLoaded(true);
      }
    };

    checkHealth();
  }, []);

  if (!isLoaded) return <DevPageSkeleton />;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Developer Mode</h1>
        <p className="text-muted-foreground">
          Tools, status, and resources for building the Patorbit Knowledge System.
        </p>
      </header>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Application Status */}
        <SectionCard title="Application Status" description="Current state of platform services">
          <div className="space-y-3">
            {services.map((svc) => (
              <div key={svc.key} className="flex items-center justify-between">
                <span className="text-sm font-medium">{svc.label}</span>
                <StatusIndicator status={svc.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 2. Page Navigator */}
        <SectionCard title="Page Navigator" description="Jump to any application page">
          <nav className="flex flex-wrap gap-2">
            {APP_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="inline-flex items-center rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </SectionCard>

        {/* 3. Component Playground */}
        <SectionCard title="Component Playground" description="Browse and test reusable components">
          <p className="text-sm text-muted-foreground">
            A visual catalog of UI components will be available here.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              disabled
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground opacity-60"
            >
              Button
            </button>
            <button
              disabled
              className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium opacity-60"
            >
              Card
            </button>
            <button
              disabled
              className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground opacity-60"
            >
              Badge
            </button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Component library scaffolding in progress.
          </p>
        </SectionCard>

        {/* 4. Sprint Dashboard (spans 2 cols) */}
        <SectionCard
          className="lg:col-span-2"
          title="Sprint Dashboard"
          description="Current sprint tracking overview"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current Sprint
              </span>
              <p className="text-lg font-semibold">SP-24</p>
              <p className="text-xs text-muted-foreground">Target: 2024-08-15</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current Task
              </span>
              <p className="text-lg font-semibold">PKS-123</p>
              <p className="text-xs text-muted-foreground">Implement Dev Mode page</p>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">75%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: '75%' }}
                />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </span>
              <p className="text-sm text-muted-foreground">
                Initial implementation complete. Awaiting feedback on health check responses for AI
                and Billing services.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* 5. Documentation Links */}
        <SectionCard title="Documentation" description="Key project documents and references">
          <nav className="flex flex-col space-y-1">
            {DOC_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-primary hover:underline underline-offset-4"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SectionCard>

        {/* 6. Developer Utilities */}
        <SectionCard title="Developer Utilities" description="Environment info and developer tools">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Environment
              </span>
              <p className="text-sm font-mono mt-0.5">{process.env.NODE_ENV}</p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Build Info
              </span>
              <p className="text-sm text-muted-foreground mt-0.5">
                <Link href="#" className="text-primary hover:underline underline-offset-4">
                  View build details →
                </Link>
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Feature Flags
              </span>
              <p className="text-sm text-muted-foreground mt-0.5">
                <Link href="#" className="text-primary hover:underline underline-offset-4">
                  Manage feature flags →
                </Link>
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

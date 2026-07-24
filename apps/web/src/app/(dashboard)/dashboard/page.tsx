'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-provider';

// ── Types ───────────────────────────────────────────────────────────────────

type RecentResume = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  sections?: { type: string }[];
};

type RecentCoverLetter = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

type RecentClaim = {
  id: string;
  title: string;
  confidenceScore: number;
  updatedAt: string;
  _count?: { evidences: number };
};

type ProfileData = {
  id: string;
  name: string | null;
  headline: string | null;
  avatarUrl: string | null;
};

type DashboardData = {
  profile: ProfileData;
  recentResumes: RecentResume[];
  recentCoverLetters: RecentCoverLetter[];
  recentClaims: RecentClaim[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const statusColor: Record<string, string> = {
  DRAFT: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  ACTIVE: 'text-green-600 bg-green-50 border-green-200',
  ARCHIVED: 'text-gray-500 bg-gray-50 border-gray-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusColor[status] ?? 'text-gray-500 bg-gray-50 border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${cls}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 p-8 max-w-6xl mx-auto">
      {/* Profile skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* List skeletons */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

// ── Resume Row ──────────────────────────────────────────────────────────────

function ResumeRow({ resume }: { resume: RecentResume }) {
  const sectionCount = resume.sections?.length ?? 0;

  return (
    <Link
      href={`/resumes/${resume.id}`}
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{resume.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sectionCount} section{sectionCount !== 1 ? 's' : ''} &middot; {timeAgo(resume.updatedAt)}
        </p>
      </div>
      <StatusBadge status={resume.status} />
    </Link>
  );
}

// ── Cover Letter Row ───────────────────────────────────────────────

function CoverLetterRow({ letter }: { letter: RecentCoverLetter }) {
  return (
    <Link
      href={`/cover-letters/${letter.id}`}
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{letter.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(letter.updatedAt)}</p>
      </div>
      <StatusBadge status={letter.status} />
    </Link>
  );
}

// ── Claim Row ──────────────────────────────────────────────────────────────

function ClaimRow({ claim }: { claim: RecentClaim }) {
  const evidenceCount = claim._count?.evidences ?? 0;

  return (
    <Link
      href={`/claims/${claim.id}`}
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{claim.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {evidenceCount} evidence{evidenceCount !== 1 ? 's' : ''} &middot;{' '}
          {timeAgo(claim.updatedAt)}
        </p>
      </div>
      <div className="ml-4 text-right">
        <span className="text-sm font-semibold">{Math.round(claim.confidenceScore * 100)}%</span>
        <p className="text-xs text-muted-foreground">confidence</p>
      </div>
    </Link>
  );
}

// ── Quick Action Card ───────────────────────────────────────────────────────

function QuickAction({
  label,
  description,
  href,
  icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="mt-0.5 text-primary shrink-0">{icon}</div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const profile = await api.get<ProfileData & { id: string }>('/profiles/me');
      const [recentResumes, recentCoverLetters, recentClaims] = await Promise.all([
        api.get<RecentResume[]>('/resumes/recent'),
        api.get<{ data: RecentCoverLetter[] }>('/cover-letters?limit=5'),
        api.get<RecentClaim[]>(`/claims/profile/${profile.id}`),
      ]);
      setData({
        profile,
        recentResumes,
        recentCoverLetters: recentCoverLetters.data,
        recentClaims,
      });
    } catch {
      // handled by auth interceptor
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (!data) return <DashboardSkeleton />;

  const profileData = data.profile;
  const recentResumes = data.recentResumes;
  const recentClaims = data.recentClaims;
  const totalResumes = recentResumes.length;
  const totalClaims = recentClaims.length;
  const activeResumes = recentResumes.filter((r) => r.status === 'ACTIVE').length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      {/* ── Profile greeting ──────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {profileData.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{profileData.name ? `, ${profileData.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground text-sm">
            {profileData.headline ?? 'Your career intelligence dashboard'}
          </p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Resumes" value={totalResumes} href="/resumes" />
        <StatCard label="Active Resumes" value={activeResumes} href="/resumes" />
        <StatCard label="Claims" value={totalClaims} href="/claims" />
      </div>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            label="New Resume"
            description="Create a new resume from scratch or a template"
            href="/resumes/new"
            icon={<span className="text-xl">+</span>}
          />
          <QuickAction
            label="Import Resume"
            description="Upload a PDF, DOCX, or LinkedIn export"
            href="/resumes/import"
            icon={<span className="text-xl">&uarr;</span>}
          />
          <QuickAction
            label="Add Claim"
            description="Create a new career claim with evidence"
            href="/claims/new"
            icon={<span className="text-xl">&diams;</span>}
          />
          <QuickAction
            label="Edit Profile"
            description="Update your name, headline, or settings"
            href="/profile"
            icon={<span className="text-xl">&starf;</span>}
          />
        </div>
      </section>

      {/* ── Recent Resumes ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Resumes</h2>
          <Link href="/resumes" className="text-sm text-primary hover:underline">
            View all &rarr;
          </Link>
        </div>
        {recentResumes.length === 0 ? (
          <EmptyState
            message="No resumes yet"
            action={{ label: 'Create one', href: '/resumes/new' }}
          />
        ) : (
          <div className="space-y-3">
            {recentResumes.map((r) => (
              <ResumeRow key={r.id} resume={r} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent Cover Letters ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Cover Letters</h2>
          <Link href="/cover-letters" className="text-sm text-primary hover:underline">
            View all &rarr;
          </Link>
        </div>
        {data.recentCoverLetters.length === 0 ? (
          <EmptyState
            message="No cover letters yet"
            action={{ label: 'Create one', href: '/cover-letters' }}
          />
        ) : (
          <div className="space-y-3">
            {data.recentCoverLetters.map((c) => (
              <CoverLetterRow key={c.id} letter={c} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent Claims ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Claims</h2>
          <Link href="/claims" className="text-sm text-primary hover:underline">
            View all &rarr;
          </Link>
        </div>
        {recentClaims.length === 0 ? (
          <EmptyState message="No claims yet" action={{ label: 'Add one', href: '/claims/new' }} />
        ) : (
          <div className="space-y-3">
            {recentClaims.map((c) => (
              <ClaimRow key={c.id} claim={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
      {action && (
        <Link href={action.href} className="inline-block mt-3 text-sm text-primary hover:underline">
          {action.label} &rarr;
        </Link>
      )}
    </div>
  );
}

// ── Exported Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  return <DashboardContent />;
}

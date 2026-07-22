'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';

type ResumeListItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  createdAt: string;
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d2 = Math.floor(h / 24);
  return `${d2}d ago`;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ResumeListItem[] }>('/resumes', { limit: '50' });
      setResumes(res.data);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resumes</h1>
        <Link
          href="/resumes/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 transition-opacity"
        >
          + New Resume
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No resumes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <Link
              key={r.id}
              href={`/resumes/${r.id}`}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {timeAgo(r.createdAt)} &middot; Updated {timeAgo(r.updatedAt)}
                </p>
              </div>
              <span className="text-xs capitalize text-muted-foreground">
                {r.status.toLowerCase()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

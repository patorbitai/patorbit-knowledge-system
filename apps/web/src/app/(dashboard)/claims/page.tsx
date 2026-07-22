'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';

type ClaimListItem = {
  id: string;
  title: string;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
};

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await api.get<{ id: string }>('/profiles/me');
      const data = await api.get<ClaimListItem[]>(`/claims/profile/${profile.id}`);
      setClaims(data);
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
        <h1 className="text-2xl font-bold">Claims</h1>
        <Link
          href="/claims/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 transition-opacity"
        >
          + New Claim
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No claims yet.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <Link
              key={c.id}
              href={`/claims/${c.id}`}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round(c.confidenceScore * 100)}% confidence
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

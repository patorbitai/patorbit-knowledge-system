'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-provider';

type PassportVersion = {
  id: string;
  version: number;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  snapshot: Record<string, unknown>;
};

export default function CareerPassportPage() {
  const { user } = useAuth();
  const [versions, setVersions] = useState<PassportVersion[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPassport = useCallback(async () => {
    try {
      const profile = await api.get<{ id: string }>('/profiles/me');
      setProfileId(profile.id);
      const data = await api.get<PassportVersion[]>(`/career-passport/profile/${profile.id}`);
      setVersions(data ?? []);
    } catch {
      // no passport versions yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  const createVersion = async () => {
    if (!profileId) return;
    setCreating(true);
    try {
      const v = await api.post<PassportVersion>(`/career-passport/${profileId}`, {
        snapshot: { createdFrom: 'web', timestamp: new Date().toISOString() },
      });
      setVersions((prev) => [v, ...prev]);
      setMessage({ type: 'success', text: `Version v${v.version} created` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to create version' });
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (v: PassportVersion) => {
    try {
      if (v.isPublic) {
        await api.patch(`/career-passport/${v.id}/unpublish`, {});
      } else {
        await api.patch(`/career-passport/${v.id}/publish`, {});
      }
      setVersions((prev) =>
        prev.map((x) =>
          x.id === v.id
            ? {
                ...x,
                isPublic: !x.isPublic,
                publishedAt: x.isPublic ? null : new Date().toISOString(),
              }
            : x,
        ),
      );
      setMessage({ type: 'success', text: v.isPublic ? 'Unpublished' : 'Published' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Career Passport</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Versioned snapshots of your career profile, claims, and evidence
          </p>
        </div>
        <button
          onClick={createVersion}
          disabled={creating}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50"
        >
          {creating ? 'Creating…' : '+ New Snapshot'}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-sm border cursor-pointer ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
          onClick={() => setMessage(null)}
        >
          {message.text}
        </div>
      )}

      {versions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No passport versions yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a snapshot to capture your current career profile.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div>
                <p className="font-medium">Version {v.version}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {new Date(v.createdAt).toLocaleDateString()}
                  {v.publishedAt && ` · Published ${new Date(v.publishedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${
                    v.isPublic
                      ? 'text-green-600 bg-green-50 border-green-200'
                      : 'text-gray-500 bg-gray-50 border-gray-200'
                  }`}
                >
                  {v.isPublic ? 'Public' : 'Private'}
                </span>
                <button
                  onClick={() => togglePublish(v)}
                  className="text-xs px-2 py-1 rounded border hover:bg-accent"
                >
                  {v.isPublic ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

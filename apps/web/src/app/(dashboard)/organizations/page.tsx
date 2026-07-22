'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';

type OrgMember = {
  id: string;
  profileId: string;
  role: string;
  profile: { name: string | null; avatarUrl: string | null };
};

type Organization = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  members: OrgMember[];
  _count: { members: number; workspaces: number };
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Organization[]>('/organizations');
      setOrgs(data);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/organizations', { name, description: description || undefined });
      setShowCreate(false);
      setName('');
      setDescription('');
      fetchOrgs();
    } catch {
      /* handled */
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
        >
          + New Organization
        </button>
      </div>

      {showCreate && (
        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h3 className="font-semibold">Create Organization</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-background"
              placeholder="Organization name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-background resize-y"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm border rounded hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {orgs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No organizations yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create one to start collaborating.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="border rounded-lg p-5 bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{org.name}</h3>
                    {org.isVerified && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  {org.description && (
                    <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                  )}
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-block mt-1"
                    >
                      {org.website}
                    </a>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>
                    {org._count.members} member{org._count.members !== 1 ? 's' : ''}
                  </p>
                  <p>
                    {org._count.workspaces} workspace{org._count.workspaces !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {org.members?.slice(0, 5).map((m) => (
                  <span
                    key={m.id}
                    className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
                    title={m.profile.name ?? 'Unknown'}
                  >
                    {m.profile.name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                ))}
                {org._count.members > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{org._count.members - 5} more
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/workspaces?orgId=${org.id}`}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-accent"
                >
                  View Workspaces
                </Link>
                <button className="text-xs px-3 py-1.5 border rounded hover:bg-accent">
                  Manage Members
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

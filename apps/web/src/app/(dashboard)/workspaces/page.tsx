'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';

type Workspace = {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  organization: { name: string };
};

export default function WorkspacesPage() {
  const searchParams = useSearchParams();
  const orgFilter = searchParams.get('orgId');

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(orgFilter);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const orgs = await api.get<{ id: string; name: string }[]>('/organizations');
      setOrganizations(orgs);

      if (selectedOrg) {
        const data = await api.get<Workspace[]>(`/workspaces/organization/${selectedOrg}`);
        setWorkspaces(data ?? []);
      } else {
        // Fetch workspaces from all orgs
        const allWorkspaces: Workspace[] = [];
        for (const org of orgs) {
          try {
            const ws = await api.get<Workspace[]>(`/workspaces/organization/${org.id}`);
            allWorkspaces.push(...(ws ?? []));
          } catch {
            /* skip */
          }
        }
        setWorkspaces(allWorkspaces);
      }
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [selectedOrg]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!newName.trim() || !selectedOrg) return;
    setCreating(true);
    try {
      await api.post('/workspaces', { name: newName, organizationId: selectedOrg });
      setShowCreate(false);
      setNewName('');
      fetchData();
    } catch {
      /* handled */
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!selectedOrg}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50"
          title={!selectedOrg ? 'Select an organization first' : undefined}
        >
          + New Workspace
        </button>
      </div>

      {/* Organization filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter by organization:</span>
        <button
          onClick={() => setSelectedOrg(null)}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            !selectedOrg ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
          }`}
        >
          All
        </button>
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => setSelectedOrg(org.id)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              selectedOrg === org.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent'
            }`}
          >
            {org.name}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <h3 className="font-semibold text-sm">Create Workspace</h3>
          <div>
            <label className="block text-xs font-medium mb-1">Workspace Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-background text-sm"
              placeholder="e.g., Engineering Team"
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
              disabled={creating || !newName.trim()}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Workspace list */}
      {workspaces.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No workspaces found.</p>
          {selectedOrg && (
            <p className="text-xs text-muted-foreground mt-1">Create one to organize your team.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ws.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ws.organization.name} &middot; Created{' '}
                    {new Date(ws.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/workspaces/${ws.id}`}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-accent"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

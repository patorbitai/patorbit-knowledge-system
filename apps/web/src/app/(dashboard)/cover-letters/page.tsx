'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

type CoverLetter = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

export default function CoverLettersPage() {
  const [items, setItems] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const load = async () => {
    try {
      const res = await api.get<{ data: CoverLetter[] }>('/cover-letters');
      setItems(res.data);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!newTitle.trim()) return;
    await api.post('/cover-letters', { title: newTitle.trim() });
    setShowNew(false);
    setNewTitle('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this cover letter?')) return;
    await api.del(`/cover-letters/${id}`);
    load();
  };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cover Letters</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          + New Cover Letter
        </button>
      </div>

      {showNew && (
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Cover letter title…"
            className="flex-1 border rounded px-3 py-2 text-sm bg-background"
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <button
            onClick={create}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md"
          >
            Create
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
          No cover letters yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((cl) => (
            <div
              key={cl.id}
              className="flex items-center justify-between border rounded-lg p-4 bg-card"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/cover-letters/${cl.id}`}
                  className="font-medium text-sm hover:text-primary truncate block"
                >
                  {cl.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cl.status} · Updated {new Date(cl.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => remove(cl.id)}
                className="text-xs text-red-500 hover:text-red-700 shrink-0 ml-4"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

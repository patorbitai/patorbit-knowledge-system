'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { FolderTree } from '@/components/workspace/folder-tree';
import { ItemContextMenu } from '@/components/workspace/item-context-menu';
import { WorkspaceToolbar } from '@/components/workspace/workspace-toolbar';
import { useWorkspaceStore } from '@/lib/stores/use-workspace-store';

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

export default function CoverLettersPage() {
  const { coverLetters, loadingCoverLetters, fetchCoverLetters, currentFolderId } =
    useWorkspaceStore();

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [menuTarget, setMenuTarget] = useState<{ id: string; title: string } | null>(null);

  // TODO: use workspace store createCoverLetter
  const create = async () => {
    if (!newTitle.trim()) return;
    const { api } = await import('@/lib/api');
    await api.post('/cover-letters', { title: newTitle.trim() });
    setShowNew(false);
    setNewTitle('');
    fetchCoverLetters();
  };

  useEffect(() => {
    fetchCoverLetters();
  }, [fetchCoverLetters, currentFolderId]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar — Folder tree */}
      <aside className="hidden md:block w-56 shrink-0 border-r p-3">
        <FolderTree />
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Cover Letters</h1>
          <button
            onClick={() => setShowNew(!showNew)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 transition-opacity"
          >
            + New Cover Letter
          </button>
        </div>

        {/* Inline create */}
        {showNew && (
          <div className="flex gap-2 mb-4">
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

        <WorkspaceToolbar />

        {loadingCoverLetters ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : coverLetters.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <p className="text-lg">No cover letters yet</p>
            <p className="text-sm mt-1">Create one to get started.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {coverLetters.map((cl) => (
              <div
                key={cl.id}
                className="group relative flex items-center justify-between border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
              >
                <Link href={`/cover-letters/${cl.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{cl.title}</p>
                    {cl.folderId && (
                      <span className="text-xs text-muted-foreground shrink-0">📁</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cl.status} &middot; Updated {timeAgo(cl.updatedAt)}
                  </p>
                </Link>

                <button
                  onClick={() => setMenuTarget({ id: cl.id, title: cl.title })}
                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity px-1 shrink-0 ml-4"
                >
                  ⋯
                </button>

                {menuTarget?.id === cl.id && (
                  <ItemContextMenu
                    itemId={cl.id}
                    itemTitle={cl.title}
                    itemType="cover-letter"
                    folderId={cl.folderId}
                    onClose={() => setMenuTarget(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

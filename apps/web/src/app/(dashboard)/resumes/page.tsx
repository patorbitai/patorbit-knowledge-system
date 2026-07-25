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

export default function ResumesPage() {
  const { resumes, loadingResumes, fetchResumes, currentFolderId } = useWorkspaceStore();

  const [menuTarget, setMenuTarget] = useState<{
    id: string;
    title: string;
    favorite?: boolean;
  } | null>(null);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes, currentFolderId]);

  const hasResumes = resumes.length > 0;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar — Folder tree */}
      <aside className="hidden md:block w-56 shrink-0 border-r p-3">
        <FolderTree />
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Resumes</h1>
          <Link
            href="/resumes/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 transition-opacity"
          >
            + New Resume
          </Link>
        </div>

        <WorkspaceToolbar />

        {loadingResumes ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !hasResumes ? (
          <div className="mt-12 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <p className="text-lg">No resumes yet</p>
            <p className="text-sm mt-1">Create a new resume to get started.</p>
            <Link
              href="/resumes/new"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              Create your first resume &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="group relative flex items-center justify-between border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
              >
                <Link href={`/resumes/${r.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{r.title}</p>
                    {r.favorite && <span className="text-yellow-500 text-sm shrink-0">★</span>}
                    {r.folderId && (
                      <span className="text-xs text-muted-foreground shrink-0">📁</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {timeAgo(r.createdAt)} &middot; Updated {timeAgo(r.updatedAt)}
                  </p>
                </Link>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs capitalize text-muted-foreground">
                    {r.status.toLowerCase()}
                  </span>
                  <button
                    onClick={() =>
                      setMenuTarget({ id: r.id, title: r.title, favorite: r.favorite })
                    }
                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity px-1"
                  >
                    ⋯
                  </button>
                </div>

                {/* Context menu */}
                {menuTarget?.id === r.id && (
                  <ItemContextMenu
                    itemId={r.id}
                    itemTitle={r.title}
                    itemType="resume"
                    folderId={r.folderId}
                    isFavorite={r.favorite}
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

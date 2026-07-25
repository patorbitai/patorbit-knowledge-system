'use client';

import { useCallback, useEffect, useState } from 'react';

import { type SortField, useWorkspaceStore } from '@/lib/stores/use-workspace-store';

// ── Toolbar ─────────────────────────────────────────────────────────────────────

interface WorkspaceToolbarProps {
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showArchive?: boolean;
  onShowArchive?: (show: boolean) => void;
}

export function WorkspaceToolbar({
  viewMode,
  onViewModeChange,
  showArchive,
  onShowArchive,
}: WorkspaceToolbarProps) {
  const {
    searchTerm,
    setSearchTerm,
    sortField,
    sortDir,
    setSort,
    filter,
    setFilter,
    clearFilters,
    fetchResumes,
    fetchCoverLetters,
  } = useWorkspaceStore();

  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchTerm(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, setSearchTerm]);

  // Refetch when filters change
  useEffect(() => {
    fetchResumes();
    fetchCoverLetters();
  }, [searchTerm, sortField, sortDir, filter, fetchResumes, fetchCoverLetters]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSort(field, sortDir === 'asc' ? 'desc' : 'asc');
      } else {
        setSort(field);
      }
    },
    [sortField, sortDir, setSort],
  );

  const hasFilters = searchTerm || filter.status || filter.favorite !== undefined;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search…"
          className="w-full border rounded-md px-3 py-2 pl-9 text-sm bg-background"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          🔍
        </span>
        {localSearch && (
          <button
            onClick={() => {
              setLocalSearch('');
              setSearchTerm('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status filter */}
        <select
          value={filter.status ?? ''}
          onChange={(e) => setFilter({ status: e.target.value || undefined })}
          className="border rounded px-2 py-2 text-sm bg-background"
        >
          <option value="">All status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* Favorite filter */}
        <button
          onClick={() => setFilter({ favorite: filter.favorite === true ? undefined : true })}
          className={`border rounded px-2 py-2 text-sm transition-colors ${
            filter.favorite ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-background'
          }`}
          title="Favorites only"
        >
          {filter.favorite ? '★ Favorites' : '☆ Favorites'}
        </button>

        {/* Sort */}
        <select
          value={`${sortField}:${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split(':') as [SortField, 'asc' | 'desc'];
            setSort(field, dir);
          }}
          className="border rounded px-2 py-2 text-sm bg-background"
        >
          <option value="updatedAt:desc">Newest</option>
          <option value="updatedAt:asc">Oldest</option>
          <option value="title:asc">Name A-Z</option>
          <option value="title:desc">Name Z-A</option>
          <option value="createdAt:desc">Recently created</option>
        </select>

        {/* View mode toggle */}
        {viewMode && onViewModeChange && (
          <button
            onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
            className="border rounded px-2 py-2 text-sm bg-background"
            title="Toggle view"
          >
            {viewMode === 'grid' ? '☰ List' : '▦ Grid'}
          </button>
        )}

        {/* Archive toggle */}
        {onShowArchive && (
          <button
            onClick={() => onShowArchive(!showArchive)}
            className={`border rounded px-2 py-2 text-sm transition-colors ${
              showArchive ? 'bg-orange-50 border-orange-300' : 'bg-background'
            }`}
            title={showArchive ? 'Hide archived' : 'Show archived'}
          >
            {showArchive ? '📦 Active' : '🗄️ Archived'}
          </button>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

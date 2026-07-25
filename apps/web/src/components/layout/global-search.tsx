'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

type SearchResult = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  type: 'resume' | 'cover-letter';
};

type SearchResponse = {
  resumes: SearchResult[];
  coverLetters: SearchResult[];
};

// ── Global Search ───────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get<SearchResponse>('/search', { q: term.trim() });
      setResults(data);
      setOpen(true);
    } catch {
      // handled by auth interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Click outside closes
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const hasResults = results && (results.resumes.length > 0 || results.coverLetters.length > 0);
  const totalCount = (results?.resumes.length ?? 0) + (results?.coverLetters.length ?? 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          🔍
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search resumes, cover letters…"
          className="w-64 md:w-80 border rounded-md pl-9 pr-10 py-2 text-sm bg-background"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border hidden sm:inline">
          {navigator?.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </div>

      {/* Dropdown */}
      {open && (query.trim() || loading) && (
        <div className="absolute top-full mt-1 right-0 w-96 bg-card border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Loading state */}
          {loading && (
            <div className="p-4 text-sm text-muted-foreground animate-pulse text-center">
              Searching…
            </div>
          )}

          {/* No query */}
          {!query.trim() && !loading && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Start typing to search
            </div>
          )}

          {/* No results */}
          {!loading && query.trim() && !hasResults && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Results */}
          {!loading && hasResults && (
            <div>
              {/* Resumes */}
              {results!.resumes.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50">
                    Resumes ({results!.resumes.length})
                  </div>
                  {results!.resumes.map((r) => (
                    <Link
                      key={r.id}
                      href={`/resumes/${r.id}`}
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <span className="text-sm truncate">{r.title}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        {r.status.toLowerCase()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Cover Letters */}
              {results!.coverLetters.length > 0 && (
                <div className="border-t">
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50">
                    Cover Letters ({results!.coverLetters.length})
                  </div>
                  {results!.coverLetters.map((c) => (
                    <Link
                      key={c.id}
                      href={`/cover-letters/${c.id}`}
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <span className="text-sm truncate">{c.title}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        {c.status.toLowerCase()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Total count */}
              <div className="px-3 py-2 text-[11px] text-muted-foreground border-t text-center">
                {totalCount} result{totalCount !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

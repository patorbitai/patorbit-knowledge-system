"use client";

import React, { useCallback, useState } from "react";
import {
  Search,
  Briefcase,
  Building2,
  MapPin,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { track } from "@/lib/analytics";

/* ── Types (mirror the /api/jobs/search contract) ────────────────────────── */

type FreshnessState = "active" | "probably_stale" | "expired" | "unknown";

interface JobResultItem {
  jobId: string;
  title: string;
  companyName: string;
  location: string | null;
  remote: boolean;
  employmentType: string | null;
  postedAt: string | null;
  freshness: { state: FreshnessState; reasons: string[] };
  source: {
    kind: string;
    displayName: string;
    attributionText: string;
    attributionUrl: string;
  };
  sourceUrl: string;
  applyUrl: string;
  sources: string[];
}

interface ProviderStatus {
  source: string;
  status: "ok" | "failed" | "rate_limited";
  fetched?: number;
  skipped?: number;
  code?: string;
  retryAfter?: number;
}

interface JobSearchResult {
  results: JobResultItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  providers: ProviderStatus[];
  fetchedAt: string;
}

type ViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "rate_limited"; retryAfter: number }
  | { kind: "results"; data: JobSearchResult };

/* ── Display maps ────────────────────────────────────────────────────────── */

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "arbeitnow", label: "Arbeitnow" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "ashby", label: "Ashby" },
];

/** Sources whose official API is per-company (board id required). */
const BOARD_SOURCES = new Set(["all", "greenhouse", "lever", "ashby"]);

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "any", label: "Any type" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
  apprenticeship: "Apprenticeship",
  seasonal: "Seasonal",
};

/**
 * Honest freshness labels — never "Live". The state comes from M7A's
 * evidence-based state machine (source-feed confirmation), not from the
 * mere existence of a database row.
 */
const FRESHNESS_STYLES: Record<
  FreshnessState,
  { label: string; className: string; hint: string }
> = {
  active: {
    label: "Confirmed recently",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
    hint: "Present in the official source feed at our last check.",
  },
  probably_stale: {
    label: "Possibly stale",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hint: "This posting or its confirmation is aging — it may be closed.",
  },
  expired: {
    label: "Expired",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
    hint: "The source reports this posting as expired.",
  },
  unknown: {
    label: "Unconfirmed",
    className: "bg-gray-500/10 text-gray-600 dark:text-slate-400",
    hint: "We have not recently confirmed this posting against the source feed.",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "Date not provided";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Date not provided";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function JobDiscoveryPanel() {
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [board, setBoard] = useState("");
  const [company, setCompany] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [remote, setRemote] = useState("any");
  const [employmentType, setEmploymentType] = useState("any");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewState>({ kind: "idle" });

  const needsBoard = BOARD_SOURCES.has(source);

  const runSearch = useCallback(
    async (nextPage: number) => {
      const params = new URLSearchParams();
      const query = q.trim();
      if (query) params.set("q", query);
      params.set(
        "sources",
        source === "all" ? "greenhouse,lever,ashby,arbeitnow" : source,
      );
      const boardValue = board.trim();
      if (boardValue) params.set("board", boardValue);
      const companyValue = company.trim();
      if (companyValue) params.set("company", companyValue);
      const locationValue = locationFilter.trim();
      if (locationValue) params.set("location", locationValue);
      if (remote !== "any") params.set("remote", remote);
      if (employmentType !== "any") params.set("employmentType", employmentType);
      params.set("page", String(nextPage));
      params.set("pageSize", "10");

      setPage(nextPage);
      setView({ kind: "loading" });

      try {
        const res = await fetch(`/api/jobs/search?${params.toString()}`);

        if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          const retryAfter =
            typeof body?.retryAfter === "number" ? body.retryAfter : 30;
          setView({ kind: "rate_limited", retryAfter });
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          // 400 bodies carry our human-readable validation message in `error`;
          // other failures use the safe `message` field (or the generic text) —
          // machine codes like INTERNAL_ERROR are never shown to users.
          let message = "Search failed. Please try again.";
          if (res.status === 400 && typeof body?.error === "string" && body.error) {
            message = body.error;
          } else if (typeof body?.message === "string" && body.message) {
            message = body.message;
          }
          setView({ kind: "error", message });
          return;
        }

        const body = await res.json().catch(() => null);
        if (!body || body.success !== true || !Array.isArray(body.results)) {
          setView({ kind: "error", message: "Search failed. Please try again." });
          return;
        }

        const data: JobSearchResult = {
          results: body.results as JobResultItem[],
          page: typeof body.page === "number" ? body.page : nextPage,
          pageSize: typeof body.pageSize === "number" ? body.pageSize : 10,
          total: typeof body.total === "number" ? body.total : 0,
          totalPages: typeof body.totalPages === "number" ? body.totalPages : 0,
          providers: Array.isArray(body.providers)
            ? (body.providers as ProviderStatus[])
            : [],
          fetchedAt: typeof body.fetchedAt === "string" ? body.fetchedAt : "",
        };
        setView({ kind: "results", data });
        track("job_search_performed", {
          source,
          page: data.page,
          result_count: data.total,
        });
      } catch {
        setView({
          kind: "error",
          message: "Could not reach Patorbit. Check your connection and try again.",
        });
      }
    },
    [q, source, board, company, locationFilter, remote, employmentType],
  );

  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      void runSearch(1);
    },
    [runSearch],
  );

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all";
  const labelClass =
    "block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1";

  return (
    <section className="space-y-5" aria-label="Job discovery">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center">
          <Search className="h-4 w-4 text-brand" />
        </div>
        <div>
          <h1 className="text-section text-ink">Discover jobs</h1>
          <p className="text-meta text-ink-muted">
            Real openings from verified sources — Greenhouse, Lever, Ashby and
            Arbeitnow. No AI is used.
          </p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="job-search-q">
              Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
              <input
                id="job-search-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                maxLength={200}
                placeholder="Title, company, or keyword..."
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="job-search-source">
              Source
            </label>
            <select
              id="job-search-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {needsBoard && (
            <div>
              <label className={labelClass} htmlFor="job-search-board">
                Board identifier
              </label>
              <input
                id="job-search-board"
                type="text"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                maxLength={64}
                placeholder="e.g. stripe"
                className={inputClass}
              />
            </div>
          )}

          {needsBoard && (
            <div>
              <label className={labelClass} htmlFor="job-search-company">
                Company display name (optional)
              </label>
              <input
                id="job-search-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={100}
                placeholder="e.g. Stripe"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="job-search-location">
              Location contains
            </label>
            <input
              id="job-search-location"
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              maxLength={100}
              placeholder="e.g. Berlin"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="job-search-remote">
              Remote
            </label>
            <select
              id="job-search-remote"
              value={remote}
              onChange={(e) => setRemote(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="any">Any</option>
              <option value="true">Remote</option>
              <option value="false">Not marked remote</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="job-search-employment">
              Employment type
            </label>
            <select
              id="job-search-employment"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={view.kind === "loading"}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-label font-semibold text-brand-contrast transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
          >
            <Search className="h-3.5 w-3.5" />
            {view.kind === "loading" ? "Searching..." : "Search jobs"}
          </button>
        </div>
      </form>

      {/* Idle hint */}
      {view.kind === "idle" && (
        <div className="rounded-xl border border-dashed border-line bg-white/[0.02] px-6 py-8 text-center">
          <p className="text-card text-ink mb-1">Search real job postings</p>
          <p className="text-secondary-size text-ink-secondary max-w-md mx-auto leading-relaxed">
            Pick a source, add a board identifier for company-specific feeds,
            and search. Results come straight from each source&apos;s official
            API — your resume and profile never leave Patorbit.
          </p>
        </div>
      )}

      {/* Loading — skeleton instead of a bare spinner */}
      {view.kind === "loading" && (
        <div className="space-y-3" role="status" aria-label="Searching jobs">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-subtle bg-surface p-4">
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/[0.06] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.06] rounded w-1/4" />
                </div>
                <div className="h-6 w-20 bg-white/[0.06] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {view.kind === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 flex items-start gap-3"
        >
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">
              {view.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runSearch(page)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/30 px-3 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Rate-limit state (429 from the shared contract) */}
      {view.kind === "rate_limited" && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 flex items-start gap-3"
        >
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              Job source rate limit reached.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">
              You can run {view.retryAfter > 0 ? `another search in about ${view.retryAfter}s` : "another search shortly"} —
              this limit protects the official source APIs for everyone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runSearch(page)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {view.kind === "results" && (
        <div className="space-y-4">
          {/* Provider notices — partial failures are visible, never hidden */}
          {view.data.providers.some((p) => p.status === "failed") && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Some sources didn&apos;t respond:{" "}
              {view.data.providers
                .filter((p) => p.status === "failed")
                .map((p) => p.source)
                .join(", ")}
              . Showing results from the rest.
            </div>
          )}
          {view.data.providers.some((p) => p.status === "rate_limited") && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Source rate limit reached mid-search — showing partial results.
            </div>
          )}

          <p className="text-meta text-ink-muted" aria-live="polite">
            {view.data.total} job{view.data.total === 1 ? "" : "s"} found
          </p>

          {view.data.results.length === 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-6 py-8 text-center">
              <Search className="h-5 w-5 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-slate-400">
                No jobs matched your search. Try different keywords or remove
                some filters.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {view.data.results.map((job) => {
              const freshness = FRESHNESS_STYLES[job.freshness.state] ?? FRESHNESS_STYLES.unknown;
              const showApplySeparately = job.applyUrl !== job.sourceUrl;
              return (
                <article
                  key={job.jobId}
                  className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 hover:border-gray-300 dark:hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Building2 className="h-4.5 w-4.5 text-gray-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {job.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {job.companyName}
                          </p>
                        </div>
                        <span
                          title={freshness.hint}
                          className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${freshness.className}`}
                        >
                          {freshness.label}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-gray-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location ?? "Location not provided"}
                        </span>
                        {job.remote && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                            Remote
                          </span>
                        )}
                        {job.employmentType && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] font-medium">
                            {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {formatDate(job.postedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          via {job.source.displayName}
                          {job.sources.length > 1 && ` (+${job.sources.length - 1} more)`}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            track("job_viewed", {
                              source: job.source.kind,
                              freshness: job.freshness.state,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 dark:bg-[#0ea5e9] text-[11px] font-semibold text-white hover:brightness-110 transition-all"
                        >
                          View posting
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {showApplySeparately && (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              track("job_viewed", {
                                source: job.source.kind,
                                freshness: job.freshness.state,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-[11px] font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                          >
                            Apply
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500">
                          {job.source.attributionText}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {view.data.total > 0 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => void runSearch(Math.max(1, view.data.page - 1))}
                disabled={view.data.page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Page {view.data.page} of {Math.max(1, view.data.totalPages)}
              </span>
              <button
                type="button"
                onClick={() => void runSearch(view.data.page + 1)}
                disabled={view.data.page >= view.data.totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Honesty footnote */}
          <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-relaxed">
            Freshness reflects the latest official source-feed confirmation —
            not a guarantee that the role is still open. &quot;Unconfirmed&quot;
            means we haven&apos;t re-verified the posting recently.
          </p>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import type { Resume } from "@/types/resume";
import type { ResumeScore, BulletSuggestion, KeywordAnalysis, JdMatchResult } from "@/lib/ai/types";
import { fingerprint, readCache, writeCache, AI_CACHE_KEYS } from "@/lib/ai/cache";

// ── Score state ───────────────────────────────────────────────────────────────

interface ScoreState {
  score: ResumeScore | null;
  loading: boolean;
  error: string | null;
}

// ── Bullets state ─────────────────────────────────────────────────────────────

interface BulletsState {
  suggestions: Record<string, BulletSuggestion[]>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

// ── Keywords state ────────────────────────────────────────────────────────────

interface KeywordsState {
  analysis: KeywordAnalysis | null;
  loading: boolean;
  error: string | null;
}

// ── Match state ───────────────────────────────────────────────────────────────

interface MatchState {
  result: JdMatchResult | null;
  loading: boolean;
  error: string | null;
}

// ── Summary state ─────────────────────────────────────────────────────────────

interface SummaryState {
  /** Accumulated streamed text. Empty string = nothing generated yet. */
  draft: string;
  streaming: boolean;
  error: string | null;
}

// ── Public return type ────────────────────────────────────────────────────────

export interface UseOptimizationReturn {
  // Score
  score: ResumeScore | null;
  scoreLoading: boolean;
  scoreError: string | null;
  analyze: (resume: Resume, jobDescription?: string) => Promise<void>;
  resetScore: () => void;

  // Bullets
  bulletSuggestions: Record<string, BulletSuggestion[]>;
  isBulletsLoading: (entryId: string) => boolean;
  getBulletsError: (entryId: string) => string | null;
  improveBullets: (resume: Resume, entryId: string) => Promise<void>;
  dismissBullet: (entryId: string, bulletIndex: number) => void;
  clearAllBullets: () => void;

  // Match
  matchResult: JdMatchResult | null;
  matchLoading: boolean;
  matchError: string | null;
  analyzeMatch: (resume: Resume, jobDescription: string) => Promise<void>;
  resetMatch: () => void;

  // Keywords
  keywordAnalysis: KeywordAnalysis | null;
  keywordsLoading: boolean;
  keywordsError: string | null;
  analyzeKeywords: (resume: Resume, jobDescription: string) => Promise<void>;
  resetKeywords: () => void;

  // Summary
  summaryDraft: string;
  summaryStreaming: boolean;
  summaryError: string | null;
  generateSummary: (
    resume: Resume,
    tone?: "professional" | "technical" | "creative" | "academic",
    jobDescription?: string,
  ) => Promise<void>;
  cancelSummary: () => void;
  clearSummary: () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialScore: ScoreState      = { score: null, loading: false, error: null };
const initialBullets: BulletsState   = { suggestions: {}, loading: {}, error: {} };
const initialKeywords: KeywordsState = { analysis: null, loading: false, error: null };
const initialMatch: MatchState       = { result: null, loading: false, error: null };
const initialSummary: SummaryState   = { draft: "", streaming: false, error: null };

// ── SSE line parser ───────────────────────────────────────────────────────────
// Parses "event: X\ndata: Y\n\n" blocks from a raw text chunk.
function* parseSSEChunk(raw: string): Generator<{ event: string; data: string }> {
  const blocks = raw.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "message";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data = line.slice(5).trim();
    }
    if (data) yield { event, data };
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOptimization(): UseOptimizationReturn {
  const [scoreState,    setScoreState]    = useState<ScoreState>(initialScore);
  const [bulletsState,  setBulletsState]  = useState<BulletsState>(initialBullets);
  const [keywordsState, setKeywordsState] = useState<KeywordsState>(initialKeywords);
  const [matchState,    setMatchState]    = useState<MatchState>(initialMatch);
  const [summaryState,  setSummaryState]  = useState<SummaryState>(initialSummary);

  const scoreAbortRef    = useRef<AbortController | null>(null);
  const bulletAbortRefs  = useRef<Record<string, AbortController>>({});
  const keywordsAbortRef = useRef<AbortController | null>(null);
  const matchAbortRef    = useRef<AbortController | null>(null);
  const summaryAbortRef  = useRef<AbortController | null>(null);
  const summaryBufferRef = useRef<string>("");

  // ── Score ─────────────────────────────────────────────────────────────────

  const analyze = useCallback(async (resume: Resume, jobDescription?: string) => {
    scoreAbortRef.current?.abort();
    const controller = new AbortController();
    scoreAbortRef.current = controller;

    // Return cached result when inputs haven't changed
    const fp = fingerprint(resume, jobDescription ?? "");
    const cached = readCache<ResumeScore>(AI_CACHE_KEYS.score, fp);
    if (cached) {
      setScoreState({ score: cached, loading: false, error: null });
      return;
    }

    setScoreState({ score: null, loading: true, error: null });

    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
        signal: controller.signal,
      });

      const json = (await res.json()) as { success: boolean; data?: ResumeScore; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to score resume.");
      const data = json.data ?? null;
      if (data) writeCache(AI_CACHE_KEYS.score, fp, data);
      setScoreState({ score: data, loading: false, error: null });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setScoreState({ score: null, loading: false, error: message });
    }
  }, []);

  const resetScore = useCallback(() => {
    scoreAbortRef.current?.abort();
    setScoreState(initialScore);
  }, []);

  // ── Bullets ───────────────────────────────────────────────────────────────

  const improveBullets = useCallback(async (resume: Resume, entryId: string) => {
    // Per-entry cache key; fingerprint includes full resume so any edit invalidates it
    const fp = fingerprint(resume, entryId);
    const cacheKey = `${AI_CACHE_KEYS.bullets}_${entryId}`;
    const cached = readCache<BulletSuggestion[]>(cacheKey, fp);
    if (cached) {
      setBulletsState((prev) => ({
        ...prev,
        suggestions: { ...prev.suggestions, [entryId]: cached },
      }));
      return;
    }

    bulletAbortRefs.current[entryId]?.abort();
    const controller = new AbortController();
    bulletAbortRefs.current[entryId] = controller;

    setBulletsState((prev) => ({
      ...prev,
      loading: { ...prev.loading, [entryId]: true },
      error:   { ...prev.error,   [entryId]: null },
    }));

    try {
      const res = await fetch("/api/ai/bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, entryId }),
        signal: controller.signal,
      });

      const json = (await res.json()) as { success: boolean; data?: BulletSuggestion[]; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to improve bullets.");

      const data = json.data ?? [];
      writeCache(cacheKey, fp, data);
      setBulletsState((prev) => ({
        ...prev,
        suggestions: { ...prev.suggestions, [entryId]: data },
        loading:     { ...prev.loading,     [entryId]: false },
        error:       { ...prev.error,        [entryId]: null },
      }));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setBulletsState((prev) => ({
        ...prev,
        loading: { ...prev.loading, [entryId]: false },
        error:   { ...prev.error,   [entryId]: message },
      }));
    }
  }, []);

  const dismissBullet = useCallback((entryId: string, bulletIndex: number) => {
    setBulletsState((prev) => ({
      ...prev,
      suggestions: {
        ...prev.suggestions,
        [entryId]: (prev.suggestions[entryId] ?? []).filter((s) => s.bulletIndex !== bulletIndex),
      },
    }));
  }, []);

  const clearAllBullets = useCallback(() => {
    setBulletsState((prev) => ({ ...prev, suggestions: {} }));
  }, []);

  const isBulletsLoading = useCallback(
    (entryId: string) => bulletsState.loading[entryId] === true,
    [bulletsState.loading],
  );

  const getBulletsError = useCallback(
    (entryId: string) => bulletsState.error[entryId] ?? null,
    [bulletsState.error],
  );

  // ── Keywords ──────────────────────────────────────────────────────────────

  const analyzeKeywords = useCallback(async (resume: Resume, jobDescription: string) => {
    const fp = fingerprint(resume, jobDescription);
    const cached = readCache<KeywordAnalysis>(AI_CACHE_KEYS.keywords, fp);
    if (cached) {
      setKeywordsState({ analysis: cached, loading: false, error: null });
      return;
    }

    keywordsAbortRef.current?.abort();
    const controller = new AbortController();
    keywordsAbortRef.current = controller;

    setKeywordsState({ analysis: null, loading: true, error: null });

    try {
      const res = await fetch("/api/ai/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
        signal: controller.signal,
      });

      const json = (await res.json()) as { success: boolean; data?: KeywordAnalysis; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to analyse keywords.");
      const data = json.data ?? null;
      if (data) writeCache(AI_CACHE_KEYS.keywords, fp, data);
      setKeywordsState({ analysis: data, loading: false, error: null });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setKeywordsState({ analysis: null, loading: false, error: message });
    }
  }, []);

  const resetKeywords = useCallback(() => {
    keywordsAbortRef.current?.abort();
    setKeywordsState(initialKeywords);
  }, []);

  // ── Match ─────────────────────────────────────────────────────────────────

  const analyzeMatch = useCallback(async (resume: Resume, jobDescription: string) => {
    const fp = fingerprint(resume, jobDescription);
    const cached = readCache<JdMatchResult>(AI_CACHE_KEYS.match, fp);
    if (cached) {
      setMatchState({ result: cached, loading: false, error: null });
      return;
    }

    matchAbortRef.current?.abort();
    const controller = new AbortController();
    matchAbortRef.current = controller;

    setMatchState({ result: null, loading: true, error: null });

    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
        signal: controller.signal,
      });

      const json = (await res.json()) as { success: boolean; data?: JdMatchResult; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to analyse job match.");
      const data = json.data ?? null;
      if (data) writeCache(AI_CACHE_KEYS.match, fp, data);
      setMatchState({ result: data, loading: false, error: null });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMatchState({ result: null, loading: false, error: message });
    }
  }, []);

  const resetMatch = useCallback(() => {
    matchAbortRef.current?.abort();
    setMatchState(initialMatch);
  }, []);

  // ── Summary ───────────────────────────────────────────────────────────────

  const generateSummary = useCallback(async (
    resume: Resume,
    tone: "professional" | "technical" | "creative" | "academic" = "professional",
    jobDescription?: string,
  ) => {
    summaryAbortRef.current?.abort();
    const controller = new AbortController();
    summaryAbortRef.current = controller;
    summaryBufferRef.current = "";

    setSummaryState({ draft: "", streaming: true, error: null });

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, tone, jobDescription }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        // Non-2xx before stream starts — parse as JSON error
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? "Failed to generate summary.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        rawBuffer += decoder.decode(value, { stream: true });

        // Flush complete SSE blocks (terminated by double newline)
        const boundary = rawBuffer.lastIndexOf("\n\n");
        if (boundary === -1) continue;

        const toProcess = rawBuffer.slice(0, boundary + 2);
        rawBuffer = rawBuffer.slice(boundary + 2);

        for (const { event, data } of parseSSEChunk(toProcess)) {
          if (event === "chunk") {
            const parsed = JSON.parse(data) as { text?: string };
            if (typeof parsed.text === "string") {
              summaryBufferRef.current += parsed.text;
              setSummaryState((prev) => ({
                ...prev,
                draft: summaryBufferRef.current,
              }));
            }
          } else if (event === "error") {
            const parsed = JSON.parse(data) as { error?: string };
            throw new Error(parsed.error ?? "Generation failed.");
          }
          // "done" event: no action needed — stream will end naturally
        }
      }

      setSummaryState({ draft: summaryBufferRef.current, streaming: false, error: null });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // Keep whatever was streamed so far; just mark as not streaming
        setSummaryState((prev) => ({ ...prev, streaming: false }));
        return;
      }
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSummaryState((prev) => ({ ...prev, streaming: false, error: message }));
    }
  }, []);

  const cancelSummary = useCallback(() => {
    summaryAbortRef.current?.abort();
    setSummaryState((prev) => ({ ...prev, streaming: false }));
  }, []);

  const clearSummary = useCallback(() => {
    summaryAbortRef.current?.abort();
    summaryBufferRef.current = "";
    setSummaryState(initialSummary);
  }, []);

  return {
    score:        scoreState.score,
    scoreLoading: scoreState.loading,
    scoreError:   scoreState.error,
    analyze,
    resetScore,

    bulletSuggestions: bulletsState.suggestions,
    isBulletsLoading,
    getBulletsError,
    improveBullets,
    dismissBullet,
    clearAllBullets,

    keywordAnalysis: keywordsState.analysis,
    keywordsLoading: keywordsState.loading,
    keywordsError:   keywordsState.error,
    analyzeKeywords,
    resetKeywords,

    matchResult:  matchState.result,
    matchLoading: matchState.loading,
    matchError:   matchState.error,
    analyzeMatch,
    resetMatch,

    summaryDraft:    summaryState.draft,
    summaryStreaming: summaryState.streaming,
    summaryError:    summaryState.error,
    generateSummary,
    cancelSummary,
    clearSummary,
  };
}

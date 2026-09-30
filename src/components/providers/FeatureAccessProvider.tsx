"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { entitlementService, type PlanFeatures, type SubscriptionTier, type SubscriptionStatus } from "@/services/entitlement.service";
import type { RestrictionContext, RestrictionMessage } from "@/lib/feature-access";
import { getRestrictionMessage, isFeatureAvailable } from "@/lib/feature-access";
import { track } from "@/lib/analytics";
import { onAiUsageChanged, setQuotaExhaustedHandler } from "@/lib/ai/client";

/* ── Usage visibility (M6) ────────────────────────────────────────────────── */

/** One counter from GET /api/account/usage. limit -1 = unlimited. */
export interface UsageCounter {
  current: number;
  limit: number;
}

export type UsageCounters = Partial<
  Record<"ai_generations" | "job_analysis" | "ai_tailoring", UsageCounter>
>;

/* ── Context ──────────────────────────────────────────────────────────────── */

interface FeatureAccessContextValue {
  /** Current user's effective tier. */
  tier: SubscriptionTier;
  /** Whether the subscription is active. */
  isActive: boolean;
  /** Current user's feature flags. */
  features: PlanFeatures | null;
  /** Whether entitlement data is still loading. */
  loading: boolean;

  /** Usage counters from GET /api/account/usage (null until loaded / unauthenticated). */
  usage: UsageCounters | null;
  /** Re-fetch usage counters (after a metered AI call). */
  refreshUsage: () => void;

  /** Show an access restriction dialog for a specific restriction type. */
  showRestriction: (ctx: RestrictionContext) => void;

  /** Check if a specific feature is available. */
  hasFeature: (featureKey: keyof PlanFeatures) => boolean;

  /** The currently active restriction context (if dialog is open). */
  activeRestriction: RestrictionContext | null;

  /** The computed message for the active restriction. */
  activeMessage: RestrictionMessage | null;

  /** Close the active restriction dialog. */
  closeRestriction: () => void;
}

const FeatureAccessContext = createContext<FeatureAccessContextValue | null>(null);

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useFeatureAccess(): FeatureAccessContextValue {
  const ctx = useContext(FeatureAccessContext);
  if (!ctx) {
    // Graceful fallback for components outside the provider (e.g., marketing pages)
    return {
      tier: "Free",
      isActive: false,
      features: null,
      loading: false,
      usage: null,
      refreshUsage: () => {},
      showRestriction: () => {},
      hasFeature: () => true,
      activeRestriction: null,
      activeMessage: null,
      closeRestriction: () => {},
    };
  }
  return ctx;
}

/* ── Provider ─────────────────────────────────────────────────────────────── */

export function FeatureAccessProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [tier, setTier] = useState<SubscriptionTier>("Free");
  const [isActive, setIsActive] = useState(false);
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRestriction, setActiveRestriction] = useState<RestrictionContext | null>(null);
  const [usage, setUsage] = useState<UsageCounters | null>(null);

  /** Keep the usage counters current; called on mount and after AI usage changes. */
  const refreshUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/account/usage");
      if (!res.ok) return;
      const data = await res.json();
      const pick = (key: "ai_generations" | "job_analysis" | "ai_tailoring"): UsageCounter | undefined => {
        const c = data[key];
        if (c && typeof c.current === "number" && typeof c.limit === "number") {
          return { current: c.current, limit: c.limit };
        }
        return undefined;
      };
      setUsage({
        ai_generations: pick("ai_generations"),
        job_analysis: pick("job_analysis"),
        ai_tailoring: pick("ai_tailoring"),
      });
    } catch {
      // usage visibility is best-effort — never blocks the app
    }
  }, []);

  // Fetch entitlements when session changes
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      // Unauthenticated users get Free tier
      setTier("Free");
      setIsActive(false);
      setUsage(null); // no usage hints for unauthenticated users
      setFeatures({
        maxResumes: 2,
        allTemplates: false,
        aiBasic: true,
        aiAdvanced: false,
        jobAnalysisBasic: true,
        jobAnalysisAdvanced: false,
        qualificationMatchBasic: true,
        qualificationMatchFull: false,
        careerProfileBasic: true,
        careerProfileFull: false,
        careerInsights: false,
        passport: false,
        evidence: false,
        knowledgeGraph: false,
        trustScore: false,
        careerTimeline: false,
        atsBasic: true,
        atsAdvanced: false,
        pdfExport: true,
        prioritySupport: false,
        organizationFeatures: false,
        apiAccess: false,
        sso: false,
        customIntegrations: false,
      });
      setLoading(false);
      return;
    }

    // Fetch entitlements from server
    const fetchEntitlements = async () => {
      try {
        const res = await fetch("/api/account/usage");
        if (res.ok) {
          const data = await res.json();
          const t = entitlementService.normalizeTier(data.subscription?.tier);
          const s = data.subscription?.status || "inactive";
          const active = s === "active" || s === "trialing";
          setTier(active && t !== "Free" ? t : "Free");
          setIsActive(active);
          setFeatures(data.entitlements?.features || null);
          // M6 — keep the usage counters this fetch already returns (they were
          // previously discarded): drives UsageHint + the quota-gate detail.
          const pick = (key: "ai_generations" | "job_analysis" | "ai_tailoring"): UsageCounter | undefined => {
            const c = data[key];
            if (c && typeof c.current === "number" && typeof c.limit === "number") {
              return { current: c.current, limit: c.limit };
            }
            return undefined;
          };
          setUsage({
            ai_generations: pick("ai_generations"),
            job_analysis: pick("job_analysis"),
            ai_tailoring: pick("ai_tailoring"),
          });
        }
      } catch {
        // Fallback to Free tier
        setTier("Free");
        setIsActive(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEntitlements();
  }, [session, status]);

  // M6 — refresh usage after any metered AI call (debounced: bursts of section
  // AI actions trigger one refetch, not five).
  useEffect(() => {
    if (status === "loading" || !session?.user?.id) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = onAiUsageChanged(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        void refreshUsage();
      }, 500);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [session, status, refreshUsage]);

  // M6 — quota exhausted: reuse the existing restriction modal with truthful
  // detail ("N of M … used this month") derived from the usage counters.
  useEffect(() => {
    if (status === "loading" || !session?.user?.id) {
      setQuotaExhaustedHandler(null);
      return;
    }
    const unsubscribe = setQuotaExhaustedHandler(({ route, detail }) => {
      const featureKey: "ai_generations" | "job_analysis" | "ai_tailoring" =
        route === "/api/ai/match"
          ? "job_analysis"
          : route === "/api/ai/tailor"
            ? "ai_tailoring"
            : "ai_generations";
      const counter = usage?.[featureKey];
      const featureName =
        featureKey === "job_analysis"
          ? "Job analysis"
          : featureKey === "ai_tailoring"
            ? "Resume tailoring"
            : "AI generation actions";
      const detailLabel =
        featureKey === "job_analysis"
          ? "job-analysis actions"
          : featureKey === "ai_tailoring"
            ? "tailoring actions"
            : "AI generation actions";
      const fallbackDetail =
        counter && counter.limit !== -1
          ? `${counter.current} of ${counter.limit} ${detailLabel} used this month`
          : undefined;
      setActiveRestriction({
        type: "ai-feature",
        featureName,
        detail: fallbackDetail ?? detail,
      });
      track("upgrade_viewed", { type: "ai-feature" });
    });
    return unsubscribe;
  }, [session, status, usage]);

  const showRestriction = useCallback((ctx: RestrictionContext) => {
    setActiveRestriction(ctx);
    // Funnel: contextual upgrade prompt shown (§15, §16).
    track("upgrade_viewed", { type: ctx.type });
  }, []);

  const hasFeature = useCallback(
    (featureKey: keyof PlanFeatures): boolean => {
      if (!features) return false;
      return isFeatureAvailable(features, featureKey);
    },
    [features],
  );

  const closeRestriction = useCallback(() => {
    setActiveRestriction(null);
  }, []);

  const activeMessage = activeRestriction ? getRestrictionMessage(activeRestriction) : null;

  const value: FeatureAccessContextValue = {
    tier,
    isActive,
    features,
    loading,
    usage,
    refreshUsage,
    showRestriction,
    hasFeature,
    activeRestriction,
    activeMessage,
    closeRestriction,
  };

  return (
    <FeatureAccessContext.Provider value={value}>
      {children}
    </FeatureAccessContext.Provider>
  );
}

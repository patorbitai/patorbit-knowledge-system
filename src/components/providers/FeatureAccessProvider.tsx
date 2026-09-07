"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { entitlementService, type PlanFeatures, type SubscriptionTier, type SubscriptionStatus } from "@/services/entitlement.service";
import type { RestrictionContext, RestrictionMessage } from "@/lib/feature-access";
import { getRestrictionMessage, isFeatureAvailable } from "@/lib/feature-access";

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

  // Fetch entitlements when session changes
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      // Unauthenticated users get Free tier
      setTier("Free");
      setIsActive(false);
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

  const showRestriction = useCallback((ctx: RestrictionContext) => {
    setActiveRestriction(ctx);
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

"use client";

import { useActionState, useState, useEffect } from "react";
import { updateProfile, deleteAccount, type SettingsState } from "@/actions/settings";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, User, Lock, Trash2, Download, Sun, Moon, Check, Briefcase } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { keys, createStore } from "idb-keyval";

const evidenceStore = createStore("patorbit-evidence-blobs", "evidence-files");

const initialState: SettingsState = { success: false, message: "" };

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export function SettingsClient({
  initialName,
  email,
  emailVerified,
  createdAt,
  subscriptionTier,
  subscriptionStatus,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: {
  initialName: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(async (prev: SettingsState, fd: FormData) => {
    const res = await deleteAccount(prev, fd);
    if (res.success) {
      await signOut({ callbackUrl: "/login" });
    }
    return res;
  }, initialState);

  const [confirmText, setConfirmText] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  // C35: Professional Identity state
  const [piLoading, setPiLoading] = useState(true);
  const [piData, setPiData] = useState<Record<string, unknown> | null>(null);
  const [piSaving, setPiSaving] = useState(false);
  const [piSaved, setPiSaved] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/identity")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profileData) setPiData(data.profileData as Record<string, unknown>);
      })
      .catch(() => {}) // silently fail — PI section just won't show pre-filled data
      .finally(() => setPiLoading(false));
  }, []);

  const handlePiSave = async (profileData: Record<string, unknown>) => {
    setPiSaving(true);
    setPiError(null);
    try {
      const res = await fetch("/api/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      setPiSaved(true);
      setTimeout(() => setPiSaved(false), 3000);
    } catch (err: unknown) {
      setPiError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPiSaving(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setBillingMessage(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to open billing portal");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      setBillingMessage(err instanceof Error ? err.message : "Failed to open portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.")) return;
    setCancelLoading(true);
    setBillingMessage(null);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel subscription");
      }
      window.location.reload();
    } catch (err: unknown) {
      setBillingMessage(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setExportLoading(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      // 1. Fetch server-owned data from authenticated API
      const res = await fetch("/api/user/export");
      if (!res.ok) {
        throw new Error("Failed to fetch server-owned data export.");
      }
      const serverData = await res.json();

      // 2. Collect client-owned data from browser localStorage (Zustand persist store)
      let clientResumeData = null;
      try {
        const localRaw = typeof window !== "undefined" ? localStorage.getItem("patorbit-resume-v2") : null;
        if (localRaw) {
          clientResumeData = JSON.parse(localRaw);
        }
      } catch {
        clientResumeData = null;
      }

      // 3. Collect client-owned evidence metadata/keys from IndexedDB
      let indexedDbEvidenceKeys: string[] = [];
      try {
        if (typeof window !== "undefined") {
          const storedKeys = await keys(evidenceStore);
          indexedDbEvidenceKeys = storedKeys.map(String);
        }
      } catch {
        indexedDbEvidenceKeys = [];
      }

      // 4. Combine into ONE complete export payload
      const completeExport = {
        exportVersion: "1.0.0",
        exportedAt: new Date().toISOString(),
        serverDataSource: serverData,
        clientLocalStorage: {
          storeKey: "patorbit-resume-v2",
          data: clientResumeData,
        },
        clientIndexedDbEvidenceBlobs: {
          storeName: "patorbit-evidence-blobs",
          evidenceBlobKeys: indexedDbEvidenceKeys,
        },
      };

      const jsonString = JSON.stringify(completeExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patorbit-complete-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportSuccess(true);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to download complete data.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── APPEARANCE SECTION ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Appearance</h2>
            <p className="text-xs text-slate-400">Choose your preferred application theme.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
              theme === "dark"
                ? "border-cyan-500 bg-cyan-500/10 text-white"
                : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]"
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm font-medium">Dark</p>
                <p className="text-xs text-slate-400">Premium dark SaaS mode</p>
              </div>
            </div>
            {theme === "dark" && <Check className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
              theme === "light"
                ? "border-cyan-500 bg-cyan-500/10 text-white"
                : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/[0.15]"
            }`}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium">Light</p>
                <p className="text-xs text-slate-400">Clean professional light mode</p>
              </div>
            </div>
            {theme === "light" && <Check className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* ── PROFILE SECTION ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Profile Information</h2>
            <p className="text-xs text-slate-400">Update your account profile details.</p>
          </div>
        </div>

        <form action={profileAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="settings-name-input" className="block text-sm font-medium text-slate-300">
              Full name
            </label>
            <input
              id="settings-name-input"
              name="name"
              type="text"
              required
              defaultValue={initialName}
              disabled={profilePending}
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Email address
            </label>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-slate-900/50 px-4 py-2.5">
              <span className="text-sm text-slate-300">{email}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                emailVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {emailVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {emailVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              Account created
            </label>
            <p className="text-xs text-slate-400">
              {new Date(createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {profileState.message && (
            <p role="alert" className={`text-xs p-3 rounded-lg border ${
              profileState.success ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}>
              {profileState.message}
            </p>
          )}

          <button
            type="submit"
            disabled={profilePending}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {profilePending && <Spinner />}
            Save Changes
          </button>
        </form>
      </div>

      {/* ── PROFESSIONAL IDENTITY SECTION ───────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Professional Identity</h2>
            <p className="text-xs text-slate-400">Your canonical professional information used by AI tailoring and resume creation.</p>
          </div>
        </div>

        {piLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Spinner />
            <span className="text-xs text-slate-400">Loading professional identity...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <ProfessionalIdentityEditorInline
              initialData={piData}
              saving={piSaving}
              saved={piSaved}
              error={piError}
              onSave={handlePiSave}
            />
          </div>
        )}
      </div>

      {/* ── EXTERNAL VERIFICATION (LINKEDIN & GITHUB) ─────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">External Account Verification</h2>
            <p className="text-xs text-slate-400">Connect LinkedIn and GitHub to verify your professional identity and activity.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* LinkedIn */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
            <div>
              <h3 className="text-sm font-medium text-white">LinkedIn Verification</h3>
              <p className="text-xs text-slate-400 mt-0.5">Verify your employment profile and identity claims via LinkedIn OAuth.</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/auth/linkedin"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
              >
                Connect LinkedIn
              </a>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Disconnect LinkedIn?")) {
                    await fetch("/api/auth/linkedin/disconnect", { method: "DELETE" });
                    window.location.reload();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* GitHub */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
            <div>
              <h3 className="text-sm font-medium text-white">GitHub Activity Sync & Verification</h3>
              <p className="text-xs text-slate-400 mt-0.5">Verify your technical contributions, repositories, and engineering skills.</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/auth/github"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
              >
                Connect GitHub
              </a>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Disconnect GitHub?")) {
                    await fetch("/api/auth/github/disconnect", { method: "DELETE" });
                    window.location.reload();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BILLING & SUBSCRIPTION SECTION ────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Billing & Subscription</h2>
            <p className="text-xs text-slate-400">Manage your subscription plan, billing details, and payments.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">Current Plan: <span className="text-cyan-400 font-semibold">{subscriptionTier}</span></h3>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                  subscriptionStatus === "active" ? "bg-emerald-500/20 text-emerald-300" :
                  subscriptionStatus === "past_due" ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-300"
                }`}>
                  {subscriptionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {cancelAtPeriodEnd ? "Your subscription is set to cancel at the end of the billing period." :
                 currentPeriodEnd ? `Renews on ${new Date(currentPeriodEnd).toLocaleDateString()}` : "Free tier access."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
              >
                {subscriptionTier === "Free" ? "Upgrade Plan" : "Change Plan"}
              </Link>
              {subscriptionTier !== "Free" && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {portalLoading ? <Spinner /> : "Billing Portal"}
                  </button>
                  {!cancelAtPeriodEnd && (
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {cancelLoading ? <Spinner /> : "Cancel Subscription"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {billingMessage && (
            <p role="alert" className="text-xs p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300">
              {billingMessage}
            </p>
          )}
        </div>
      </div>

      {/* ── SECURITY SECTION ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Account Security</h2>
            <p className="text-xs text-slate-400">Manage your password and authentication security.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-slate-900/50 p-4">
            <div>
              <h3 className="text-sm font-medium text-white">Password Recovery</h3>
              <p className="text-xs text-slate-400 mt-0.5">Request a password reset link sent to your registered email address.</p>
            </div>
            <Link
              href="/forgot-password"
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white transition-colors shrink-0"
            >
              Reset Password
            </Link>
          </div>
        </div>
      </div>

      {/* ── DATA & PRIVACY / GDPR EXPORT SECTION ─────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Data & Privacy (GDPR Export)</h2>
            <p className="text-xs text-slate-400">Download a complete export of all your personal and professional data.</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            You have the right to access and export your data. Clicking the button below will combine server identity data with client-side resume, claims, and evidence metadata into a complete JSON export file.
          </p>

          {exportSuccess && (
            <p role="status" className="text-xs p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              Complete data export downloaded successfully.
            </p>
          )}

          {exportError && (
            <p role="alert" className="text-xs p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300">
              {exportError}
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={handleDownloadData}
              disabled={exportLoading}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {exportLoading && <Spinner />}
              <Download className="w-4 h-4" />
              Download Complete Data Export (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* ── DANGER ZONE (ACCOUNT DELETION) ────────────────────────── */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-rose-400">Danger Zone</h2>
            <p className="text-xs text-slate-400">Permanently delete your account and all associated data.</p>
          </div>
        </div>

        <form action={deleteAction} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Once you delete your account, there is no going back. All professional identity data, claims, and sessions will be permanently removed.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="settings-delete-confirm-input" className="block text-xs font-medium text-slate-400">
              Type <strong className="text-rose-400">DELETE</strong> to confirm:
            </label>
            <input
              id="settings-delete-confirm-input"
              name="confirmation"
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={deletePending}
              className="w-full sm:w-64 rounded-xl border border-rose-500/30 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-rose-500/50 disabled:opacity-50"
            />
          </div>

          {deleteState.message && (
            <p role="alert" className="text-xs p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300">
              {deleteState.message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={deletePending || confirmText !== "DELETE"}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deletePending && <Spinner />}
              Permanently Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Inline Professional Identity editor for the Settings page.
 * Dark-themed to match the Settings aesthetic.
 * Loads existing data from the server and saves via PUT /api/identity.
 */
function ProfessionalIdentityEditorInline({
  initialData,
  saving,
  saved,
  error,
  onSave,
}: {
  initialData: Record<string, unknown> | null;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50";
  const labelClass = "block text-xs font-medium text-slate-300 mb-1";

  const [profile, setProfile] = useState<Record<string, unknown>>({
    fullName: "",
    headline: "",
    summary: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    experience: [],
    education: [],
    skills: [],
    ...(initialData || {}),
  });

  useEffect(() => {
    if (initialData) setProfile((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  const update = (field: string, value: unknown) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            value={(profile.fullName as string) || ""}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Jane Smith"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Professional Headline</label>
          <input
            value={(profile.headline as string) || ""}
            onChange={(e) => update("headline", e.target.value)}
            placeholder="Senior Data Engineer"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input
            value={(profile.email as string) || ""}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            value={(profile.phone as string) || ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Location</label>
          <input
            value={(profile.location as string) || ""}
            onChange={(e) => update("location", e.target.value)}
            placeholder="San Francisco, CA"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>LinkedIn</label>
          <input
            value={(profile.linkedin as string) || ""}
            onChange={(e) => update("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/janesmith"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Professional Summary</label>
        <textarea
          value={(profile.summary as string) || ""}
          onChange={(e) => update("summary", e.target.value)}
          placeholder="Experienced data engineer with 5+ years..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1" />
        {error && <span className="text-xs text-rose-400">{error}</span>}
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
        <button
          onClick={() => onSave(profile)}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors"
        >
          {saving ? <Spinner /> : "Save Professional Identity"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { updateProfile, deleteAccount, type SettingsState } from "@/actions/settings";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, User, Lock, Trash2, Download } from "lucide-react";
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
}: {
  initialName: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}) {
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

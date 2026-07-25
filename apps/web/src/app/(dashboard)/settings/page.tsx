'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/auth-provider';
import { useAccountStore } from '@/lib/stores/use-account-store';

// ── Settings Section Wrapper ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold border-b pb-2">{title}</h2>
      {children}
    </section>
  );
}

// ── Settings Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, loading, fetchProfile, updateProfile, changePassword } = useAccountStore();

  // Form fields
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setHeadline(profile.headline ?? '');
      setSummary(profile.summary ?? '');
    }
  }, [profile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await updateProfile({ name, headline, summary });
      setProfileSaved(true);
    } catch (err: any) {
      setProfileError(err?.message ?? 'Failed to save');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message ?? 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* ── Profile Section ──────────────────────────────── */}
      <Section title="Profile">
        {profileSaved && (
          <div className="p-3 text-sm bg-green-50 text-green-700 rounded border border-green-200">
            Profile updated successfully.
          </div>
        )}
        {profileError && (
          <div
            className="p-3 text-sm bg-red-50 text-red-700 rounded border border-red-200"
            role="alert"
          >
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full border rounded px-3 py-2 text-sm bg-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Headline</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              placeholder="e.g. Senior Software Engineer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm bg-background resize-y"
              placeholder="Brief professional summary"
            />
          </div>
          <button
            type="submit"
            disabled={profileSaving || loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* ── Password Section ─────────────────────────────── */}
      <Section title="Security">
        {passwordSaved && (
          <div className="p-3 text-sm bg-green-50 text-green-700 rounded border border-green-200">
            Password changed successfully.
          </div>
        )}
        {passwordError && (
          <div
            className="p-3 text-sm bg-red-50 text-red-700 rounded border border-red-200"
            role="alert"
          >
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {passwordSaving ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </Section>

      {/* ── Theme Preferences ────────────────────────────── */}
      <Section title="Theme">
        <p className="text-sm text-muted-foreground">Theme customization coming soon.</p>
      </Section>

      {/* ── Notification Preferences ─────────────────────── */}
      <Section title="Notifications">
        <p className="text-sm text-muted-foreground">Notification preferences coming soon.</p>
      </Section>
    </div>
  );
}

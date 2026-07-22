'use client';

import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-provider';

type ProfileData = {
  name: string | null;
  headline: string | null;
  summary: string | null;
  avatarUrl: string | null;
  locale: string;
};

function ProfileSkeleton() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-64 bg-gray-200 rounded" />
      <div className="space-y-4 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [locale, setLocale] = useState('en');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<ProfileData>('/profiles/me');
      setProfile(data);
      setName(data.name ?? '');
      setHeadline(data.headline ?? '');
      setSummary(data.summary ?? '');
      setLocale(data.locale ?? 'en');
    } catch {
      // handled
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      await api.patch('/profile', { name, headline, summary, locale });
      setSaved(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <ProfileSkeleton />;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your public profile information</p>
      </div>

      {saved && (
        <div className="p-3 text-sm bg-green-50 text-green-700 rounded border border-green-200">
          Profile updated successfully.
        </div>
      )}

      {error && (
        <div
          className="p-3 text-sm bg-destructive/10 text-destructive rounded border border-destructive/20"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-background"
          />
        </div>

        <div>
          <label htmlFor="headline" className="block text-sm font-medium mb-1">
            Headline
          </label>
          <input
            id="headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-background"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium mb-1">
            Summary
          </label>
          <textarea
            id="summary"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-background resize-y"
          />
        </div>

        <div>
          <label htmlFor="locale" className="block text-sm font-medium mb-1">
            Language
          </label>
          <select
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-background"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <hr className="border-t" />

      <div>
        <h2 className="text-lg font-semibold mb-2">Account</h2>
        <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
      </div>
    </div>
  );
}

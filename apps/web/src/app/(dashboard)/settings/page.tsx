'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-provider';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full border rounded px-3 py-2 text-sm bg-muted"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Theme</h2>
        <p className="text-sm text-muted-foreground">Theme customization coming soon.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Notifications</h2>
        <p className="text-sm text-muted-foreground">Notification preferences coming soon.</p>
      </section>
    </div>
  );
}

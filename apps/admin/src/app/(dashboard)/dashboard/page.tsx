'use client';
import { useState } from 'react';

type StatCard = {
  label: string;
  value: number;
  change?: string;
};

export default function AdminDashboardPage() {
  const [stats] = useState<StatCard[]>([
    { label: 'Total Users', value: 1247, change: '+12%' },
    { label: 'Active Subscriptions', value: 892, change: '+5%' },
    { label: 'Resumes', value: 4803, change: '+18%' },
    { label: 'Claims', value: 12540, change: '+22%' },
  ]);

  const [recentActivity] = useState([
    { action: 'User registered', user: 'john@example.com', time: '2m ago' },
    { action: 'Subscription upgraded', user: 'jane@example.com', time: '15m ago' },
    { action: 'Resume imported', user: 'bob@example.com', time: '1h ago' },
    { action: 'New organization created', user: 'Acme Corp', time: '2h ago' },
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value.toLocaleString()}</p>
            {s.change && <p className="text-xs text-green-600 mt-1">{s.change}</p>}
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <div className="space-y-2">
          {recentActivity.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm"
            >
              <span>
                {a.action} — <span className="text-muted-foreground">{a.user}</span>
              </span>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

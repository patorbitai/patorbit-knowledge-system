'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

export default function CoverLetterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ title: string }>(`/cover-letters/${id}`);
        setTitle(data.title);
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    await api.patch(`/cover-letters/${id}`, { title });
    router.push('/cover-letters');
  };

  if (loading) return <div className="p-6 text-muted-foreground animate-pulse">Loading…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Cover Letter</h1>
      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm bg-background"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md"
          >
            Save
          </button>
          <button
            onClick={() => router.push('/cover-letters')}
            className="px-3 py-1.5 text-sm border rounded-md"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

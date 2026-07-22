'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
};

export default function NewResumePage() {
  const router = useRouter();
  const [title, setTitle] = useState('Untitled Resume');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await api.get<{ data: Template[] }>('/templates');
        setTemplates(data.data);
      } catch (err) {
        setError('Failed to load templates.');
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const newResume = await api.post<{ id: string }>('/resumes', {
        title,
        templateId,
      });
      router.push(`/resumes/${newResume.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create resume.');
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/resumes"
          className="text-sm text-muted-foreground hover:text-foreground mb-2 block"
        >
          &larr; Back to Resumes
        </Link>
        <h1 className="text-3xl font-bold">New Resume</h1>
        <p className="text-muted-foreground mt-1">
          Start a new resume from scratch or pick a template to begin.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Resume Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-background"
            placeholder="e.g., Software Engineer Resume"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Choose a Template (Optional)</label>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-lg aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setTemplateId(null)}
                className={`border-2 rounded-lg cursor-pointer transition-all ${
                  templateId === null
                    ? 'border-primary ring-2 ring-primary/50'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center aspect-[3/4] bg-card p-4 text-center">
                  <span className="text-2xl mb-2">📄</span>
                  <p className="font-semibold text-sm">Blank</p>
                  <p className="text-xs text-muted-foreground">Start with a clean slate</p>
                </div>
              </div>
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setTemplateId(template.id)}
                  className={`border-2 rounded-lg cursor-pointer transition-all ${
                    templateId === template.id
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center aspect-[3/4] bg-card p-4 text-center">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl mb-2">📄</span>
                    )}
                    <p className="font-semibold text-sm mt-2">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          disabled={creating || !title}
          className="bg-primary text-primary-foreground px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {creating ? 'Creating...' : 'Create Resume'}
        </button>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { api } from '@/lib/api';

const IMPORT_SOURCES = [
  { id: 'pdf', label: 'PDF', icon: '📄', description: 'Upload a PDF resume' },
  { id: 'docx', label: 'DOCX', icon: '📝', description: 'Upload a Word document' },
  { id: 'json', label: 'JSON', icon: '📋', description: 'Import from JSON format' },
  { id: 'linkedin', label: 'LinkedIn', icon: '🔗', description: 'Paste LinkedIn profile export' },
] as const;

type ImportSource = (typeof IMPORT_SOURCES)[number]['id'];

export default function ImportResumePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<ImportSource>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [linkedinData, setLinkedinData] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<{ resumeId?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError('');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');

    try {
      if (source === 'linkedin') {
        if (!linkedinData.trim()) {
          setError('Please paste your LinkedIn profile data.');
          setImporting(false);
          return;
        }
        // Create an import job for LinkedIn data
        const job = await api.post<{ id: string }>('/import/resume', {
          sourceType: 'linkedin',
          sourceData: { raw: linkedinData },
        });
        setJobId(job.id);
        pollJob(job.id);
      } else if (file) {
        // For file-based imports, upload and create job
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sourceType', source);

        const job = await api.post<{ id: string }>('/import/resume', {
          sourceType: source,
          sourceData: { fileName: file.name, fileSize: file.size },
        });
        setJobId(job.id);
        pollJob(job.id);
      } else {
        setError('Please select a file to import.');
        setImporting(false);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to start import.');
      setImporting(false);
    }
  };

  const pollJob = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const job = await api.get<{
          status: string;
          result?: { resumeId: string };
          error?: string;
        }>(`/import/jobs/${id}`);
        if (job.status === 'completed') {
          clearInterval(interval);
          setResult(job.result ?? null);
          setImporting(false);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setError(job.error ?? 'Import failed.');
          setImporting(false);
        }
      } catch {
        clearInterval(interval);
        setError('Failed to check import status.');
        setImporting(false);
      }
    }, 2000);

    // Timeout after 60 seconds
    setTimeout(() => {
      clearInterval(interval);
      if (!result) {
        setError('Import timed out. Please try again.');
        setImporting(false);
      }
    }, 60000);
  };

  const confirmImport = async () => {
    if (!jobId) return;
    try {
      const res = await api.post<{ resumeId: string }>(`/import/jobs/${jobId}/confirm`);
      router.push(`/resumes/${res.resumeId}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to confirm import.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/resumes"
          className="text-sm text-muted-foreground hover:text-foreground mb-2 block"
        >
          &larr; Back to Resumes
        </Link>
        <h1 className="text-3xl font-bold">Import Resume</h1>
        <p className="text-muted-foreground mt-1">
          Import an existing resume from a file or LinkedIn export.
        </p>
      </div>

      {error && (
        <div
          className="p-3 text-sm bg-red-50 text-red-700 rounded border border-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Source selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Source Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {IMPORT_SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSource(s.id);
                setFile(null);
                setError('');
              }}
              className={`flex flex-col items-center gap-1 p-4 rounded-lg border-2 transition-all ${
                source === s.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/50'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium">{s.label}</span>
              <span className="text-xs text-muted-foreground text-center">{s.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File upload */}
      {source !== 'linkedin' && (
        <div>
          <label className="block text-sm font-medium mb-2">Upload File</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
          >
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs text-red-500 mt-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <span className="text-2xl block mb-2">📁</span>
                <p className="text-sm text-muted-foreground">
                  Click to select a file or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {source === 'pdf' ? 'PDF' : source === 'docx' ? 'DOCX' : 'JSON'} file up to 10 MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={source === 'pdf' ? '.pdf' : source === 'docx' ? '.docx' : '.json'}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* LinkedIn paste area */}
      {source === 'linkedin' && (
        <div>
          <label className="block text-sm font-medium mb-2">LinkedIn Profile Data</label>
          <textarea
            rows={8}
            value={linkedinData}
            onChange={(e) => setLinkedinData(e.target.value)}
            placeholder="Paste your LinkedIn profile export or profile data here..."
            className="w-full border rounded px-3 py-2 bg-background resize-y font-mono text-sm"
          />
        </div>
      )}

      {/* Action */}
      <div className="flex justify-end gap-3">
        <Link href="/resumes" className="px-4 py-2 text-sm rounded border hover:bg-accent">
          Cancel
        </Link>
        <button
          onClick={importing ? undefined : result ? confirmImport : handleImport}
          disabled={importing || (source === 'linkedin' ? !linkedinData.trim() : !file)}
          className="bg-primary text-primary-foreground px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {importing ? 'Importing...' : result ? 'Confirm & Open Resume' : 'Start Import'}
        </button>
      </div>

      {/* Progress */}
      {importing && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded border border-blue-200">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Importing your resume...</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import {
  ResumeEditorLayout,
  ResumeHeader,
  ResumeLoadingSkeleton,
  ResumeProvider,
} from '@/components/resume';
import { useResumeStore } from '@/lib/stores/use-resume-store';

export default function ResumeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const resume = useResumeStore((s) => s.resume);
  const isLoading = useResumeStore((s) => s.isLoading);
  const message = useResumeStore((s) => s.message);
  const loadResume = useResumeStore((s) => s.loadResume);
  const setMessage = useResumeStore((s) => s.setMessage);
  const reset = useResumeStore((s) => s.reset);

  // Load the resume on mount; reset on unmount
  useEffect(() => {
    loadResume(id);
    return () => {
      reset();
    };
  }, [id, loadResume, reset]);

  // Show loading skeleton while fetching
  if (isLoading || !resume) {
    return <ResumeLoadingSkeleton />;
  }

  return (
    <ResumeProvider resumeId={id}>
      <div className="flex flex-col h-full">
        {/* Flash messages */}
        {message && (
          <div
            className={`p-3 text-sm border-b cursor-pointer ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
            onClick={() => setMessage(null)}
          >
            {message.text}
          </div>
        )}

        {/* Header */}
        <ResumeHeader />

        {/* Main content: side-by-side editor and preview */}
        <ResumeEditorLayout resumeId={id} />
      </div>
    </ResumeProvider>
  );
}

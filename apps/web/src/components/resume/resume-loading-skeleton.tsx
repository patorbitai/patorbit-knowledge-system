// apps/web/src/components/resume/resume-loading-skeleton.tsx

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function ResumeLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="p-6 border-b">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>
      {/* Editor/Preview Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full lg:w-1/2 p-6 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-9 w-28" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block lg:w-1/2 bg-gray-50 p-6">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Skeleton className="h-8 w-56" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <hr className="my-6" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-full" />
              <hr className="my-6" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPreparationLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8" aria-busy="true" aria-live="polite">
      <div className="h-8 w-64 animate-pulse rounded-md bg-white/[0.06]" />
      <div className="h-4 w-full max-w-2xl animate-pulse rounded-md bg-white/[0.04]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-subtle bg-surface" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl border border-subtle bg-surface lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-xl border border-subtle bg-surface" />
      </div>
      <p className="sr-only">Loading interview preparation</p>
    </div>
  );
}

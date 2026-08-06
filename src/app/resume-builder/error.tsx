"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-2xl">
        ⚠️
      </div>
      <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-400">
        We hit an unexpected error while rendering this page. Your work is saved
        locally — you can try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Try again
      </button>
    </div>
  );
}

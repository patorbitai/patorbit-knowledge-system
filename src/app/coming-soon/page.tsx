"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Rocket, ArrowLeft, ArrowRight } from "lucide-react";

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ?? "This feature";

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#070B14] px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/20">
          <Rocket className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Coming Soon
        </h1>
        <p className="mt-4 text-[17px] text-slate-400 leading-relaxed">
          We&apos;re actively building <span className="font-semibold text-white">{page}</span>. This
          feature will be available here shortly.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-3 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <Link
            href="/resume-builder"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02]"
          >
            Build Your Passport
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={null}>
      <ComingSoonContent />
    </Suspense>
  );
}

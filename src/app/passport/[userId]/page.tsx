"use strict";

import { prisma } from "@/lib/prisma";
import { PublicPassportView } from "@/components/identity/PublicPassportView";
import { ShieldCheck } from "lucide-react";

export default async function PublicPassportPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const identity = await prisma.professionalIdentity.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!identity || !identity.passportShareEnabled || !identity.passportDataCache) {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Passport Private or Unavailable</h1>
          <p className="text-xs text-slate-400">
            This Professional Passport is private, disabled, or does not exist.
          </p>
        </div>
      </main>
    );
  }

  let data;
  try {
    data = JSON.parse(identity.passportDataCache);
  } catch {
    data = null;
  }

  if (!data || !data.resume) {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Passport Data Error</h1>
          <p className="text-xs text-slate-400">Unable to load public passport data.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070911] text-slate-300 py-12 px-4 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              Verified Professional Passport
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">{identity.user.name}&apos;s Passport</h1>
            <p className="text-xs text-slate-400 mt-1">Read-only verified professional identity and career credentials.</p>
          </div>
        </div>
        <PublicPassportView resume={data.resume} claims={data.claims ?? []} evidence={data.evidence ?? []} />
      </div>
    </main>
  );
}

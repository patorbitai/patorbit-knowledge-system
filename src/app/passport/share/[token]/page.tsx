"use strict";

import { prisma } from "@/lib/prisma";
import { PublicPassportView } from "@/components/identity/PublicPassportView";
import { ShieldCheck } from "lucide-react";

export default async function PublicPassportSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const identity = await prisma.professionalIdentity.findUnique({
    where: { passportShareToken: token },
    include: { user: true },
  });

  if (!identity || !identity.passportShareEnabled || !identity.passportDataCache) {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Passport Private or Unavailable</h1>
          <p className="text-xs text-slate-400">
            This Professional Passport link is invalid, has been revoked, or the passport is private.
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

  // Filter out private/sensitive fields from the public view
  const publicResume = {
    ...data.resume,
    email: "", // Never expose email publicly
    phone: "", // Never expose phone publicly
    address: "", // Never expose address publicly
  };

  return (
    <main className="min-h-screen bg-[#070911] text-slate-300 py-12 px-4 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              Verified Professional Passport
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">{identity.user.name}&apos;s Passport</h1>
            <p className="text-xs text-slate-400 mt-1">Read-only professional identity and career credentials.</p>
          </div>
        </div>
        <PublicPassportView resume={publicResume} claims={data.claims ?? []} evidence={data.evidence ?? []} />
      </div>
    </main>
  );
}

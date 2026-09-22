"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { ImportButton } from "@/components/resume-builder/ImportButton";
import type { IdentityScoreData } from "@/lib/identity-score";

type DashboardHeaderProps = {
  identityData?: IdentityScoreData;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHeader({ identityData }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || "User";
  const firstName = name.split(" ")[0] || "there";

  return (
    <section className="space-y-6" aria-labelledby="dashboard-greeting">
      {/* Greeting & Professional Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 id="dashboard-greeting" className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xl">
            Your career operating system. Manage your professional identity, applications, and opportunities in one place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <ImportButton variant="hero" />
          {identityData && identityData.score > 0 && (
            <Link
              href="/overview#identity"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
            >
              View Identity Score {identityData.score}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JobApplicationsSection } from "@/components/hub/applications/JobApplicationsSection";

export const metadata = {
  title: "Jobs — Patorbit",
  description: "Track your job applications and saved positions.",
};

export default async function JobsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* M7B — entry point to job discovery (separate from the application tracker). */}
      <div className="flex justify-end">
        <Link
          href="/jobs/discover"
          className="inline-flex h-8 items-center rounded-md border border-line px-3 text-label font-semibold text-ink hover:bg-white/[0.04] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Discover real jobs
        </Link>
      </div>
      <JobApplicationsSection />
    </div>
  );
}

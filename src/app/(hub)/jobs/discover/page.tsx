import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JobDiscoveryPanel } from "@/components/hub/jobs/JobDiscoveryPanel";

export const metadata = {
  title: "Discover jobs — Patorbit",
  description:
    "Search real openings from verified job sources: Greenhouse, Lever, Ashby, and Arbeitnow.",
};

export default async function DiscoverJobsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <JobDiscoveryPanel />
    </div>
  );
}

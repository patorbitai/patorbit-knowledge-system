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
      <JobApplicationsSection />
    </div>
  );
}

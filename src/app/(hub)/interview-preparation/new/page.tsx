import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { jobApplicationService } from "@/services/job-application.service";
import CreateProfileForm from "@/components/hub/interview/CreateProfileForm";

export const metadata = {
  title: "New interview profile — Patorbit",
};

export const dynamic = "force-dynamic";

export default async function NewInterviewProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const identity = await identityService.ensureProfessionalIdentity(session.user.id);
  const applications = await jobApplicationService.list(identity.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link
          href="/interview-preparation"
          className="inline-flex items-center gap-1.5 text-label text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Interview Preparation
        </Link>
        <h1 className="mt-2 text-page-title text-ink">New interview profile</h1>
        <p className="mt-1.5 max-w-2xl text-secondary-size text-ink-secondary">
          One profile per interview. Add the company, role and round now — you can add more rounds later
          without losing previous preparation.
        </p>
      </div>

      <CreateProfileForm
        applications={applications.map((application) => ({
          applicationId: application.applicationId,
          companyName: application.companyName,
          title: application.title,
          jobDescription: application.jobDescription,
          status: application.status,
        }))}
      />
    </div>
  );
}

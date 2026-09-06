import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { jobApplicationService } from "@/services/job-application.service";
import { ApplicationDetailClient } from "@/app/(hub)/overview/applications/[applicationId]/ApplicationDetailClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

export const metadata = {
  title: "Application — Patorbit",
};

export default async function JobDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return notFound();
  }

  const { applicationId } = await params;

  const identity = await identityService.ensureProfessionalIdentity(session.user.id);

  try {
    const application = await jobApplicationService.get(identity.id, applicationId);
    const name = session.user.name || "User";

    return (
      <ApplicationDetailClient
        application={application}
        userName={name}
      />
    );
  } catch {
    return notFound();
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { jobApplicationService } from "@/services/job-application.service";
import { ApplicationDetailClient } from "./ApplicationDetailClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
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

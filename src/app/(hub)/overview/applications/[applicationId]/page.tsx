import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

/**
 * Redirect legacy /overview/applications/[applicationId] to /jobs/[applicationId].
 * Preserves backward compatibility for old links.
 */
export default async function ApplicationDetailPage({ params }: PageProps) {
  const { applicationId } = await params;
  redirect(`/jobs/${applicationId}`);
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrustTimelineView } from "@/components/identity/TrustTimelineView";
import { identityService } from "@/services/identity.service";

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/trust/timeline");
  }

  try {
    await identityService.ensureProfessionalIdentity(session.user.id);
  } catch (err) {
    console.error("Failed to ensure professional identity:", err);
  }

  return <TrustTimelineView />;
}

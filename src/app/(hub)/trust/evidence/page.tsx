import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EvidenceExplorerView } from "@/components/identity/EvidenceExplorerView";
import { identityService } from "@/services/identity.service";

export default async function EvidencePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/trust/evidence");
  }

  try {
    await identityService.ensureProfessionalIdentity(session.user.id);
  } catch (err) {
    console.error("Failed to ensure professional identity:", err);
  }

  return <EvidenceExplorerView />;
}

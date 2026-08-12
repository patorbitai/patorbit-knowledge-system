import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrustView } from "@/components/identity/TrustView";
import { identityService } from "@/services/identity.service";

export default async function TrustPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/trust");
  }

  try {
    await identityService.ensureProfessionalIdentity(session.user.id);
  } catch (err) {
    console.error("Failed to ensure professional identity:", err);
  }

  return <TrustView />;
}

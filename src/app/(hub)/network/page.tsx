import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NetworkView } from "@/components/identity/NetworkView";
import { identityService } from "@/services/identity.service";

export default async function NetworkPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/network");
  }

  try {
    await identityService.ensureProfessionalIdentity(session.user.id);
  } catch (err) {
    console.error("Failed to ensure professional identity:", err);
  }

  return <NetworkView />;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIdentityScore } from "@/lib/identity-score";
import { identityService } from "@/services/identity.service";
import { OverviewCommandCenter } from "@/components/hub/overview/OverviewCommandCenter";

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";

  const data = await getIdentityScore(session?.user?.id);

  // C35: Check onboarding status
  let onboardingCompleted = true; // Default to true for existing users
  if (session?.user?.id) {
    const identity = await identityService.getIdentity(session.user.id);
    if (identity) {
      onboardingCompleted = identity.onboardingCompleted;
    } else {
      // No identity = new user
      onboardingCompleted = false;
    }
  }

  return (
    <OverviewCommandCenter
      name={name}
      email={email}
      data={data}
      onboardingCompleted={onboardingCompleted}
    />
  );
}

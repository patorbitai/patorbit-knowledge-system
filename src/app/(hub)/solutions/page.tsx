import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIdentityScore } from "@/lib/identity-score";
import { identityService } from "@/services/identity.service";
import { OverviewCommandCenter } from "@/components/hub/overview/OverviewCommandCenter";
import SolutionsMarketingContent from "./SolutionsMarketingContent";

export default async function SolutionsPage() {
  const session = await getServerSession(authOptions);

  // Unauthenticated visitors see marketing content
  if (!session?.user?.id) {
    return <SolutionsMarketingContent />;
  }

  const name = session.user.name || "User";
  const email = session.user.email || "";

  const data = await getIdentityScore(session.user.id);

  // C35: Check onboarding status
  let onboardingCompleted = true;
  const identity = await identityService.getIdentity(session.user.id);
  if (identity) {
    onboardingCompleted = identity.onboardingCompleted;
  } else {
    onboardingCompleted = false;
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

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIdentityScore } from "@/lib/identity-score";
import {
  IdentityHero,
  StatusRow,
  PriorityAction,
  VerificationWidget,
  KnowledgeGraphWidget,
  ActivityWidget,
  AICopilotWidget,
  QuickActionsWidget,
} from "@/components/hub/widgets";

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";

  const data = await getIdentityScore(session?.user?.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 space-y-4">
      {/* Zone 1 — Identity Hero */}
      <IdentityHero name={name} email={email} data={data} />

      {/* Zone 2 — Status Row */}
      <StatusRow data={data} />

      {/* Zone 3 — Priority Action */}
      <PriorityAction data={data} />

      {/* Zone 4 — Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column — Identity & Verification */}
        <div className="space-y-4">
          <VerificationWidget />
          <KnowledgeGraphWidget />
        </div>

        {/* Right column — Activity & AI */}
        <div className="space-y-4">
          <ActivityWidget />
          <AICopilotWidget />
        </div>
      </div>

      {/* Zone 5 — Quick Actions */}
      <QuickActionsWidget />
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIdentityScore } from "@/lib/identity-score";
import { OverviewCommandCenter } from "@/components/hub/overview/OverviewCommandCenter";

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";

  const data = await getIdentityScore(session?.user?.id);

  return <OverviewCommandCenter name={name} email={email} data={data} />;
}

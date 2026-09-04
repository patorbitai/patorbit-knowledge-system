import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AIWorkspaceClient from "@/components/hub/ai/AIWorkspaceClient";

export default async function AiPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || "User";

  return <AIWorkspaceClient userName={userName} />;
}

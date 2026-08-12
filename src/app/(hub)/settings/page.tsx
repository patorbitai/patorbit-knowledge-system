import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/repositories/user.repository";
import { SettingsClient } from "@/components/hub/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  const user = await userRepository.findById(session.user.id);
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your profile information, security preferences, and account data.
        </p>
      </div>

      <SettingsClient
        initialName={user.name}
        email={user.email}
        emailVerified={!!user.emailVerified}
        createdAt={user.createdAt.toISOString()}
        subscriptionTier={(user as any).subscriptionTier || "Free"}
        subscriptionStatus={(user as any).subscriptionStatus || "inactive"}
        currentPeriodEnd={(user as any).currentPeriodEnd ? (user as any).currentPeriodEnd.toISOString() : null}
        cancelAtPeriodEnd={(user as any).cancelAtPeriodEnd || false}
      />
    </div>
  );
}

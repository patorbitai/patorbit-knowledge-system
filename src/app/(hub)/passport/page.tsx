import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Passport } from "@/components/identity/Passport";
import { identityService } from "@/services/identity.service";
import { PassportShareControl } from "@/components/identity/PassportShareControl";

export default async function PassportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/passport");
  }

  try {
    await identityService.ensureProfessionalIdentity(session.user.id);
  } catch (err) {
    console.error("Failed to ensure professional identity:", err);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Professional Passport</h1>
        <p className="text-sm text-slate-400 mt-1">
          Package your verified claims and evidence into a shareable, tamper-evident professional passport.
        </p>
      </div>
      <PassportShareControl />
      <Passport />
    </div>
  );
}

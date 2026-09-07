import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AddJobApplicationForm } from "@/components/hub/applications/AddJobApplicationForm";

export const metadata = {
  title: "Add Job Application — Patorbit",
  description: "Add a new job application to track and tailor your resume.",
};

export default async function NewJobPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/jobs/new");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
      <AddJobApplicationForm />
    </div>
  );
}

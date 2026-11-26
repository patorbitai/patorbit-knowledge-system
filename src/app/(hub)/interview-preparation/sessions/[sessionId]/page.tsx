import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { interviewSessionService } from "@/services/interview-session.service";
import { InterviewNotFoundError } from "@/services/interview-profile.service";
import { prisma } from "@/lib/prisma";
import SessionRunner from "@/components/hub/interview/SessionRunner";

export const dynamic = "force-dynamic";

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const identity = await identityService.ensureProfessionalIdentity(session.user.id);

  let practice;
  try {
    practice = await interviewSessionService.get(identity.id, sessionId);
  } catch (err) {
    if (err instanceof InterviewNotFoundError) notFound();
    throw err;
  }

  if (practice.status === "completed") {
    redirect(`/interview-preparation/sessions/${sessionId}/report`);
  }

  const profile = await prisma.interviewProfile.findUnique({
    where: { id: practice.interviewProfileId },
    select: { companyName: true, jobTitle: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <SessionRunner
        initialSession={{
          id: practice.id,
          interviewProfileId: practice.interviewProfileId,
          sessionType: practice.sessionType,
          status: practice.status,
          questions: practice.questions,
          answers: practice.answers,
          overallScore: practice.overallScore,
        }}
        heading={profile ? `${profile.companyName} · ${profile.jobTitle}` : "Interview session"}
      />
    </div>
  );
}

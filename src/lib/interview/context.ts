import { prisma } from "@/lib/prisma";
import type { ProfileContext } from "@/lib/ai/interview-prompts";

/**
 * Builds the grounded context passed to every interview prompt.
 *
 * Candidate facts come from the user's Professional Identity (profileData) and
 * their most recent saved resume payload. Nothing is invented: missing data is
 * simply absent, and prompts are told to treat it as a gap.
 */
export async function buildProfileContext(
  professionalIdentityId: string,
  profile: {
    companyName: string;
    jobTitle: string;
    experienceYears: number | null;
    seniority: string | null;
    requiredSkills: string[];
    preferredSkills: string[];
    jobDescription: string | null;
    interviewType: string;
    interviewFormat: string | null;
    timezone: string;
    interviewRound: string | null;
    interviewDate: Date | null;
  },
  round?: { roundName: string; interviewDate: Date | null } | null,
): Promise<ProfileContext> {
  const identity = await prisma.professionalIdentity.findUnique({
    where: { id: professionalIdentityId },
    select: {
      profileData: true,
      resumes: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { payload: true },
      },
    },
  });

  const payload = (identity?.resumes?.[0]?.payload ?? null) as Record<string, unknown> | null;
  const profileData = (identity?.profileData ?? null) as Record<string, unknown> | null;
  const source = payload ?? profileData ?? {};

  const summary =
    typeof source.summary === "string" ? source.summary : typeof profileData?.summary === "string" ? profileData.summary : null;

  const skills: string[] = [];
  if (Array.isArray(source.skills)) {
    for (const skill of source.skills) {
      if (typeof skill === "string") skills.push(skill);
      else if (skill && typeof skill === "object" && typeof (skill as { name?: unknown }).name === "string") {
        skills.push((skill as { name: string }).name);
      }
    }
  }

  const roles: string[] = [];
  if (Array.isArray(source.experience)) {
    for (const entry of source.experience) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const position = typeof record.position === "string" ? record.position : "";
      const company = typeof record.company === "string" ? record.company : "";
      if (position || company) roles.push([position, company].filter(Boolean).join(" at "));
    }
  }

  return {
    companyName: profile.companyName,
    jobTitle: profile.jobTitle,
    experienceYears: profile.experienceYears,
    seniority: profile.seniority,
    requiredSkills: profile.requiredSkills,
    preferredSkills: profile.preferredSkills,
    jobDescription: profile.jobDescription,
    interviewType: profile.interviewType,
    interviewFormat: profile.interviewFormat,
    timezone: profile.timezone,
    roundName: round?.roundName ?? profile.interviewRound,
    interviewDate: (round?.interviewDate ?? profile.interviewDate)?.toISOString() ?? null,
    resumeSummary: summary,
    resumeSkills: skills.slice(0, 40),
    resumeRoles: roles.slice(0, 10),
  };
}

/**
 * C36/C36.1 — Professional Identity → Resume seeding utility.
 *
 * Maps ProfessionalIdentity.profileData (JSONB) fields to Resume payload fields.
 * This is a pure function with no side effects — safe to use on both server and client.
 *
 * IMPORTANT: This creates an independent snapshot. No shared mutable references.
 */

/** Profile data shape from ProfessionalIdentity.profileData (JSONB). */
export interface ProfileData {
  fullName?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  experience?: Array<{
    company?: string;
    position?: string;
    duration?: string;
    description?: string;
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    field?: string;
    year?: string;
  }>;
  skills?: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

let _seedIdCounter = 0;
function seedId(prefix: string): string {
  return `seed_${prefix}_${Date.now()}_${++_seedIdCounter}`;
}

/**
 * Seed a Resume from Professional Identity profile data.
 *
 * Returns an independent deep copy — no shared mutable references with profileData.
 * Fields not present in profileData remain at their current values in `base`.
 * Resume-specific fields (templateId, careerStage, etc.) are never overwritten.
 */
export function mapProfileToResume<T extends Record<string, any>>(
  base: T,
  profileData: ProfileData | null | undefined,
): T {
  if (!profileData || typeof profileData !== "object") return { ...base };

  const expItems = Array.isArray(profileData.experience)
    ? profileData.experience.map((e) => ({
        id: seedId("exp"),
        company: e.company || "",
        position: e.position || "",
        location: "",
        employmentType: "",
        industry: "",
        startDate: "",
        endDate: "",
        current: false,
        duration: e.duration || "",
        description: e.description || "",
        achievements: "",
        techUsed: "",
        bulletPoints: [],
      }))
    : [];

  const eduItems = Array.isArray(profileData.education)
    ? profileData.education.map((e) => ({
        id: seedId("edu"),
        school: e.school || "",
        degree: e.degree || "",
        year: e.year || "",
        field: e.field || "",
        gpa: "",
        minor: "",
        honors: "",
        activities: "",
        location: "",
      }))
    : [];

  const skillItems = Array.isArray(profileData.skills)
    ? profileData.skills.map((s) => s.trim()).filter(Boolean).map((s) => ({
        id: seedId("skill"),
        name: s,
        level: "Intermediate",
        category: "",
        years: "",
      }))
    : [];

  return {
    ...base,
    name: profileData.fullName || base.name,
    title: profileData.headline || base.title,
    email: profileData.email || base.email,
    phone: profileData.phone || base.phone,
    address: profileData.location || base.address,
    summary: profileData.summary || base.summary,
    social: {
      ...base.social,
      linkedin: profileData.linkedin || base.social.linkedin,
      github: profileData.github || base.social.github,
      website: profileData.website || base.social.website,
    },
    experience: expItems.length > 0 ? expItems : base.experience,
    education: eduItems.length > 0 ? eduItems : base.education,
    skills: skillItems.length > 0 ? skillItems : base.skills,
  };
}

/**
 * Check if a resume payload appears to be empty (no user-provided data).
 * Used by the server to decide whether to apply profile seeding.
 */
export function isEmptyResumePayload(payload: Record<string, unknown>): boolean {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";
  const experience = Array.isArray(payload.experience) ? payload.experience.length : 0;
  const education = Array.isArray(payload.education) ? payload.education.length : 0;
  const skills = Array.isArray(payload.skills) ? payload.skills.length : 0;

  return !name && !email && !summary && experience === 0 && education === 0 && skills === 0;
}

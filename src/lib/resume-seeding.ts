/**
 * C36/C36.1 — Professional Identity ↔ Resume seeding utility.
 *
 * Maps ProfessionalIdentity.profileData (JSONB) fields to Resume payload fields
 * and vice versa. This is a pure function with no side effects — safe to use on
 * both server and client.
 *
 * IMPORTANT: This creates independent snapshots. No shared mutable references.
 */

// ── ProfileData type ─────────────────────────────────────────────────────────
// Matches the JSONB shape stored in ProfessionalIdentity.profileData.
// All fields are optional for backward compatibility with old/partial profiles.

export interface ProfileData {
  // Basics
  fullName?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  nationality?: string;
  pronouns?: string;

  // Social
  linkedin?: string;
  github?: string;
  website?: string;
  twitter?: string;
  portfolioUrl?: string;
  stackoverflow?: string;

  // Experience
  experience?: Array<{
    company?: string;
    position?: string;
    location?: string;
    employmentType?: string;
    industry?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    duration?: string;
    description?: string;
    achievements?: string;
    techUsed?: string;
    bulletPoints?: string[];
  }>;

  // Education
  education?: Array<{
    school?: string;
    degree?: string;
    field?: string;
    year?: string;
    gpa?: string;
    minor?: string;
    honors?: string;
    activities?: string;
    location?: string;
  }>;

  // Skills
  skills?: Array<{
    name?: string;
    level?: string;
    category?: string;
    years?: string;
  }> | string[];

  // Projects
  projects?: Array<{
    name?: string;
    description?: string;
    tech?: string;
    link?: string;
    startDate?: string;
    endDate?: string;
    role?: string;
    teamSize?: string;
    status?: string;
    bulletPoints?: string[];
  }>;

  // Certifications
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    link?: string;
    description?: string;
    expiryDate?: string;
    skills?: string;
  }>;

  // Languages
  languages?: Array<{
    name?: string;
    proficiency?: string;
  }>;

  // Achievements
  achievements?: Array<{
    title?: string;
    description?: string;
    date?: string;
    issuer?: string;
  }>;

  // Portfolio
  portfolio?: Array<{
    title?: string;
    description?: string;
    url?: string;
    type?: string;
  }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

let _seedIdCounter = 0;
function seedId(prefix: string): string {
  return `seed_${prefix}_${Date.now()}_${++_seedIdCounter}`;
}

/** Safely extract a string value, returning fallback if not a string. */
function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

/** Safely extract a boolean value, returning fallback if not a boolean. */
function bool(val: unknown, fallback = false): boolean {
  return typeof val === "boolean" ? val : fallback;
}

/** Check if a value is truthy (non-empty string, non-null object, true boolean). */
function truthy(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return true;
}

/** Safely extract a number from string or number, returning fallback if invalid. */
function numStr(val: unknown, fallback = ""): string {
  if (typeof val === "number") return String(val);
  if (typeof val === "string" && val.trim()) return val.trim();
  return fallback;
}

// ── ProfileData → Resume ─────────────────────────────────────────────────────

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

  // Experience
  const expItems = Array.isArray(profileData.experience)
    ? profileData.experience.map((e) => ({
        id: seedId("exp"),
        company: str(e.company),
        position: str(e.position),
        location: str(e.location),
        employmentType: str(e.employmentType),
        industry: str(e.industry),
        startDate: str(e.startDate),
        endDate: str(e.endDate),
        current: bool(e.current),
        duration: str(e.duration),
        description: str(e.description),
        achievements: str(e.achievements),
        techUsed: str(e.techUsed),
        bulletPoints: Array.isArray(e.bulletPoints) ? e.bulletPoints.filter(Boolean) : [],
      }))
    : [];

  // Education
  const eduItems = Array.isArray(profileData.education)
    ? profileData.education.map((e) => ({
        id: seedId("edu"),
        school: str(e.school),
        degree: str(e.degree),
        year: str(e.year),
        field: str(e.field),
        gpa: str(e.gpa),
        minor: str(e.minor),
        honors: str(e.honors),
        activities: str(e.activities),
        location: str(e.location),
      }))
    : [];

  // Skills — handle both string[] and { name, level, ... }[] formats
  const skillItems = normalizeSkills(profileData.skills).map((s) => ({
    id: seedId("skill"),
    name: str(s.name),
    level: (str(s.level, "Intermediate") as any),
    category: str(s.category),
    years: str(s.years),
  }));

  // Projects
  const projectItems = Array.isArray(profileData.projects)
    ? profileData.projects.map((p) => ({
        id: seedId("proj"),
        name: str(p.name),
        description: str(p.description),
        tech: str(p.tech),
        link: str(p.link),
        startDate: str(p.startDate),
        endDate: str(p.endDate),
        role: str(p.role),
        teamSize: str(p.teamSize),
        status: str(p.status, "Completed") as any,
        bulletPoints: Array.isArray(p.bulletPoints) ? p.bulletPoints.filter(Boolean) : [],
      }))
    : [];

  // Certifications
  const certItems = Array.isArray(profileData.certifications)
    ? profileData.certifications.map((c) => ({
        id: seedId("cert"),
        name: str(c.name),
        issuer: str(c.issuer),
        date: str(c.date),
        link: str(c.link),
        description: str(c.description),
        expiryDate: str(c.expiryDate),
        skills: str(c.skills),
      }))
    : [];

  // Languages
  const langItems = Array.isArray(profileData.languages)
    ? profileData.languages.map((l) => ({
        id: seedId("lang"),
        name: str(l.name),
        proficiency: str(l.proficiency, "Fluent") as any,
      }))
    : [];

  // Achievements
  const achItems = Array.isArray(profileData.achievements)
    ? profileData.achievements.map((a) => ({
        id: seedId("ach"),
        title: str(a.title),
        description: str(a.description),
        date: str(a.date),
        issuer: str(a.issuer),
      }))
    : [];

  // Portfolio
  const portItems = Array.isArray(profileData.portfolio)
    ? profileData.portfolio.map((p) => ({
        id: seedId("port"),
        title: str(p.title),
        description: str(p.description),
        url: str(p.url),
        type: str(p.type, "other") as any,
      }))
    : [];

  return {
    ...base,
    name: profileData.fullName || base.name,
    title: profileData.headline || base.title,
    email: profileData.email || base.email,
    phone: profileData.phone || base.phone,
    address: profileData.location || base.address,
    nationality: profileData.nationality || base.nationality,
    pronouns: profileData.pronouns || base.pronouns,
    summary: profileData.summary || base.summary,
    social: {
      ...base.social,
      linkedin: profileData.linkedin || base.social.linkedin,
      github: profileData.github || base.social.github,
      website: profileData.website || base.social.website,
      twitter: profileData.twitter || base.social.twitter,
      portfolio: profileData.portfolioUrl || base.social.portfolio,
      stackoverflow: profileData.stackoverflow || base.social.stackoverflow,
    },
    experience: expItems.length > 0 ? expItems : base.experience,
    education: eduItems.length > 0 ? eduItems : base.education,
    skills: skillItems.length > 0 ? skillItems : base.skills,
    projects: projectItems.length > 0 ? projectItems : base.projects,
    certifications: certItems.length > 0 ? certItems : base.certifications,
    languages: langItems.length > 0 ? langItems : base.languages,
    achievements: achItems.length > 0 ? achItems : base.achievements,
    portfolio: portItems.length > 0 ? portItems : base.portfolio,
  };
}

// ── Resume → ProfileData ─────────────────────────────────────────────────────

/**
 * Extract a ProfileData-compatible payload from a Resume object.
 *
 * Used by "Save to Professional Identity" to push Resume data back to the
 * canonical ProfessionalIdentity.profileData. Omits resume-specific fields
 * (templateId, careerStage, etc.) and internal IDs.
 */
/**
 * Extract a ProfileData-compatible payload from a Resume object.
 *
 * Used by "Save to Professional Identity" to push Resume data back to the
 * canonical ProfessionalIdentity.profileData.
 *
 * IMPORTANT: Omits empty/undefined/null values to prevent overwriting existing
 * Professional Identity data when the payload is merged (not replaced).
 *
 * Rules:
 * - undefined/null/empty string → field is omitted
 * - empty array → array is omitted
 * - populated values → included
 * - populated arrays → included (each item has empty fields omitted)
 */
export function mapResumeToProfile(resume: Record<string, any>): ProfileData {
  if (!resume || typeof resume !== "object") return {};

  const social = (resume.social ?? {}) as Record<string, string>;

  // Helper: omit a string field if empty/whitespace
  const omitIfEmpty = (val: unknown): string | undefined => {
    const s = str(val);
    return s.trim().length > 0 ? s : undefined;
  };

  // Helper: map and filter an array section — omit the whole section if empty
  const mapArray = <T, R>(
    arr: T[] | undefined,
    mapper: (item: T) => R | null,
  ): R[] | undefined => {
    if (!Array.isArray(arr)) return undefined;
    const result = arr.map(mapper).filter((r): r is R => r !== null);
    return result.length > 0 ? result : undefined;
  };

  // Map a single experience/education/project/etc. item, omitting empty fields
  const mapExperienceItem = (e: any): Record<string, unknown> | null => {
    const obj: Record<string, unknown> = {};
    const company = omitIfEmpty(e.company);
    const position = omitIfEmpty(e.position);
    // Require at least company or position for the item to be included
    if (!company && !position) return null;
    if (company) obj.company = company;
    if (position) obj.position = position;
    const location = omitIfEmpty(e.location);
    if (location) obj.location = location;
    const employmentType = omitIfEmpty(e.employmentType);
    if (employmentType) obj.employmentType = employmentType;
    const industry = omitIfEmpty(e.industry);
    if (industry) obj.industry = industry;
    const startDate = omitIfEmpty(e.startDate);
    if (startDate) obj.startDate = startDate;
    const endDate = omitIfEmpty(e.endDate);
    if (endDate) obj.endDate = endDate;
    if (bool(e.current)) obj.current = true;
    const duration = omitIfEmpty(e.duration);
    if (duration) obj.duration = duration;
    const description = omitIfEmpty(e.description);
    if (description) obj.description = description;
    const achievements = omitIfEmpty(e.achievements);
    if (achievements) obj.achievements = achievements;
    const techUsed = omitIfEmpty(e.techUsed);
    if (techUsed) obj.techUsed = techUsed;
    const bullets = Array.isArray(e.bulletPoints)
      ? e.bulletPoints.filter((b: unknown) => typeof b === "string" && b.trim().length > 0)
      : [];
    if (bullets.length > 0) obj.bulletPoints = bullets;
    return obj;
  };

  const mapEducationItem = (e: any): Record<string, unknown> | null => {
    const obj: Record<string, unknown> = {};
    const school = omitIfEmpty(e.school);
    const degree = omitIfEmpty(e.degree);
    if (!school && !degree) return null;
    if (school) obj.school = school;
    if (degree) obj.degree = degree;
    for (const key of ["field", "year", "gpa", "minor", "honors", "activities", "location"] as const) {
      const val = omitIfEmpty(e[key]);
      if (val) obj[key] = val;
    }
    return obj;
  };

  const mapProjectItem = (p: any): Record<string, unknown> | null => {
    const obj: Record<string, unknown> = {};
    const name = omitIfEmpty(p.name);
    if (!name) return null;
    obj.name = name;
    for (const key of ["description", "tech", "link", "startDate", "endDate", "role", "teamSize"] as const) {
      const val = omitIfEmpty(p[key]);
      if (val) obj[key] = val;
    }
    const status = omitIfEmpty(p.status);
    if (status) obj.status = status;
    const bullets = Array.isArray(p.bulletPoints)
      ? p.bulletPoints.filter((b: unknown) => typeof b === "string" && b.trim().length > 0)
      : [];
    if (bullets.length > 0) obj.bulletPoints = bullets;
    return obj;
  };

  const mapCertItem = (c: any): Record<string, unknown> | null => {
    const obj: Record<string, unknown> = {};
    const name = omitIfEmpty(c.name);
    if (!name) return null;
    obj.name = name;
    for (const key of ["issuer", "date", "link", "description", "expiryDate", "skills"] as const) {
      const val = omitIfEmpty(c[key]);
      if (val) obj[key] = val;
    }
    return obj;
  };

  const mapLangItem = (l: any): Record<string, unknown> | null => {
    const name = omitIfEmpty(l.name);
    if (!name) return null;
    const obj: Record<string, unknown> = { name };
    const proficiency = omitIfEmpty(l.proficiency);
    if (proficiency) obj.proficiency = proficiency;
    return obj;
  };

  const mapAchievementItem = (a: any): Record<string, unknown> | null => {
    const title = omitIfEmpty(a.title);
    if (!title) return null;
    const obj: Record<string, unknown> = { title };
    for (const key of ["description", "date", "issuer"] as const) {
      const val = omitIfEmpty(a[key]);
      if (val) obj[key] = val;
    }
    return obj;
  };

  const mapPortfolioItem = (p: any): Record<string, unknown> | null => {
    const title = omitIfEmpty(p.title);
    if (!title) return null;
    const obj: Record<string, unknown> = { title };
    for (const key of ["description", "url", "type"] as const) {
      const val = omitIfEmpty(p[key]);
      if (val) obj[key] = val;
    }
    return obj;
  };

  // Build result — only include fields that have meaningful data
  const result: ProfileData = {};

  // Basics
  const fullName = omitIfEmpty(resume.name);
  if (fullName) result.fullName = fullName;
  const headline = omitIfEmpty(resume.title);
  if (headline) result.headline = headline;
  const summary = omitIfEmpty(resume.summary);
  if (summary) result.summary = summary;
  const email = omitIfEmpty(resume.email);
  if (email) result.email = email;
  const phone = omitIfEmpty(resume.phone);
  if (phone) result.phone = phone;
  const location = omitIfEmpty(resume.address);
  if (location) result.location = location;
  const nationality = omitIfEmpty(resume.nationality);
  if (nationality) result.nationality = nationality;
  const pronouns = omitIfEmpty(resume.pronouns);
  if (pronouns) result.pronouns = pronouns;

  // Social
  const linkedin = omitIfEmpty(social.linkedin);
  if (linkedin) result.linkedin = linkedin;
  const github = omitIfEmpty(social.github);
  if (github) result.github = github;
  const website = omitIfEmpty(social.website);
  if (website) result.website = website;
  const twitter = omitIfEmpty(social.twitter);
  if (twitter) result.twitter = twitter;
  const portfolioUrl = omitIfEmpty(social.portfolio);
  if (portfolioUrl) result.portfolioUrl = portfolioUrl;
  const stackoverflow = omitIfEmpty(social.stackoverflow);
  if (stackoverflow) result.stackoverflow = stackoverflow;

  // Array sections — omit entire section if empty
  const experience = mapArray(resume.experience, mapExperienceItem);
  if (experience) result.experience = experience as ProfileData["experience"];

  const education = mapArray(resume.education, mapEducationItem);
  if (education) result.education = education as ProfileData["education"];

  // Skills — only include if there are named skills
  if (Array.isArray(resume.skills)) {
    const skillItems = resume.skills
      .map((s: any) => {
        const name = omitIfEmpty(s.name);
        if (!name) return null;
        const obj: Record<string, unknown> = { name };
        const level = omitIfEmpty(s.level);
        if (level) obj.level = level;
        const category = omitIfEmpty(s.category);
        if (category) obj.category = category;
        const years = omitIfEmpty(s.years);
        if (years) obj.years = years;
        return obj;
      })
      .filter(Boolean);
    if (skillItems.length > 0) result.skills = skillItems as ProfileData["skills"];
  }

  const projects = mapArray(resume.projects, mapProjectItem);
  if (projects) result.projects = projects as ProfileData["projects"];

  const certifications = mapArray(resume.certifications, mapCertItem);
  if (certifications) result.certifications = certifications as ProfileData["certifications"];

  const languages = mapArray(resume.languages, mapLangItem);
  if (languages) result.languages = languages as ProfileData["languages"];

  const achievements = mapArray(resume.achievements, mapAchievementItem);
  if (achievements) result.achievements = achievements as ProfileData["achievements"];

  const portfolio = mapArray(resume.portfolio, mapPortfolioItem);
  if (portfolio) result.portfolio = portfolio as ProfileData["portfolio"];

  return result;
}

// ── Profile Completeness ─────────────────────────────────────────────────────

/** Weight for each section in the completeness calculation. */
const SECTION_WEIGHTS = {
  basics: 25,     // name, headline, email, phone, location
  experience: 20, // at least 1 entry with company + position
  education: 15,  // at least 1 entry with school + degree
  skills: 15,     // at least 3 skills
  projects: 10,   // at least 1 project
  certifications: 5,
  languages: 5,
  achievements: 5,
} as const;

export interface ProfileCompleteness {
  /** Overall score 0–100. */
  overall: number;
  /** Per-section scores (0–100 each). */
  sections: Record<keyof typeof SECTION_WEIGHTS, number>;
  /** Weighted contribution of each section to overall. */
  contributions: Record<keyof typeof SECTION_WEIGHTS, number>;
}

/**
 * Calculate profile completeness deterministically.
 * No AI, no side effects. Handles missing/empty/undefined safely.
 */
export function calculateProfileCompleteness(profile: ProfileData | null | undefined): ProfileCompleteness {
  if (!profile || typeof profile !== "object") {
    return {
      overall: 0,
      sections: zeroSections(),
      contributions: zeroSections(),
    };
  }

  // Basics: name(5) + headline(5) + email(5) + phone(5) + location(5) = 25 points
  const basicsScore = score25(
    truthy(profile.fullName),
    truthy(profile.headline),
    truthy(profile.email),
    truthy(profile.phone),
    truthy(profile.location),
  );

  // Experience: at least 1 entry with company + position
  const expArr = Array.isArray(profile.experience) ? profile.experience : [];
  const hasExp = expArr.length > 0;
  const hasExpDetail = expArr.some((e) => truthy(e.company) && truthy(e.position));
  const hasExpBullets = expArr.some((e) => Array.isArray(e.bulletPoints) && e.bulletPoints!.length > 0);
  const experienceScore = hasExpDetail ? (hasExpBullets ? 100 : 70) : hasExp ? 40 : 0;

  // Education: at least 1 entry with school + degree
  const eduArr = Array.isArray(profile.education) ? profile.education : [];
  const hasEdu = eduArr.length > 0;
  const hasEduDetail = eduArr.some((e) => truthy(e.school) && truthy(e.degree));
  const educationScore = hasEduDetail ? 100 : hasEdu ? 50 : 0;

  // Skills: count based on number (0=0, 1-2=30, 3-5=60, 6-9=80, 10+=100)
  const skillCount = countSkills(profile.skills);
  const skillsScore = skillCount >= 10 ? 100 : skillCount >= 6 ? 80 : skillCount >= 3 ? 60 : skillCount >= 1 ? 30 : 0;

  // Projects: at least 1 project with name
  const projArr = Array.isArray(profile.projects) ? profile.projects : [];
  const hasProj = projArr.some((p) => truthy(p.name));
  const projectsScore = hasProj ? 100 : 0;

  // Certifications: at least 1 with name
  const certArr = Array.isArray(profile.certifications) ? profile.certifications : [];
  const hasCert = certArr.some((c) => truthy(c.name));
  const certificationsScore = hasCert ? 100 : 0;

  // Languages: at least 1 with name
  const langArr = Array.isArray(profile.languages) ? profile.languages : [];
  const hasLang = langArr.some((l) => truthy(l.name));
  const languagesScore = hasLang ? 100 : 0;

  // Achievements: at least 1 with title
  const achArr = Array.isArray(profile.achievements) ? profile.achievements : [];
  const hasAch = achArr.some((a) => truthy(a.title));
  const achievementsScore = hasAch ? 100 : 0;

  const sections = {
    basics: basicsScore,
    experience: experienceScore,
    education: educationScore,
    skills: skillsScore,
    projects: projectsScore,
    certifications: certificationsScore,
    languages: languagesScore,
    achievements: achievementsScore,
  };

  // Weighted overall
  let totalWeight = 0;
  let weightedSum = 0;
  const contributions = {} as Record<keyof typeof SECTION_WEIGHTS, number>;
  for (const [key, weight] of Object.entries(SECTION_WEIGHTS) as [keyof typeof SECTION_WEIGHTS, number][]) {
    const contrib = Math.round((sections[key] * weight) / 100);
    contributions[key] = contrib;
    totalWeight += weight;
    weightedSum += contrib;
  }

  const overall = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  return { overall, sections, contributions };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function zeroSections(): Record<keyof typeof SECTION_WEIGHTS, number> {
  return { basics: 0, experience: 0, education: 0, skills: 0, projects: 0, certifications: 0, languages: 0, achievements: 0 };
}

/** Score basics out of 25 boolean flags (scaled to 0–100). */
function score25(...flags: boolean[]): number {
  const filled = flags.filter(Boolean).length;
  return Math.round((filled / flags.length) * 100);
}

/** Count skills from either string[] or { name }[] format. */
function countSkills(skills: ProfileData["skills"]): number {
  if (!Array.isArray(skills)) return 0;
  return skills.filter((s) => {
    if (typeof s === "string") return s.trim().length > 0;
    return truthy(s?.name);
  }).length;
}

/** Normalize skills to { name, level, category, years }[] format. */
function normalizeSkills(
  skills: ProfileData["skills"],
): Array<{ name: string; level: string; category: string; years: string }> {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => {
      if (typeof s === "string") {
        return { name: s.trim(), level: "Intermediate", category: "", years: "" };
      }
      return {
        name: str(s?.name),
        level: str(s?.level, "Intermediate"),
        category: str(s?.category),
        years: str(s?.years),
      };
    })
    .filter((s) => s.name.length > 0);
}

// ── Validation ───────────────────────────────────────────────────────────────

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

import { z } from "zod";

const SocialLinksSchema = z.object({
  linkedin: z.string().default(""),
  github: z.string().default(""),
  website: z.string().default(""),
  twitter: z.string().default(""),
  portfolio: z.string().default(""),
  stackoverflow: z.string().default(""),
});

const ExperienceSchema = z.object({
  id: z.number(),
  company: z.string().default(""),
  position: z.string().default(""),
  location: z.string().default(""),
  employmentType: z.string().default(""),
  industry: z.string().default(""),
  duration: z.string().default(""),
  description: z.string().default(""),
  achievements: z.string().default(""),
  techUsed: z.string().default(""),
});

const EducationSchema = z.object({
  id: z.number(),
  school: z.string().default(""),
  degree: z.string().default(""),
  year: z.string().default(""),
  field: z.string().default(""),
  gpa: z.string().default(""),
  minor: z.string().default(""),
  honors: z.string().default(""),
  activities: z.string().default(""),
  location: z.string().default(""),
});

const SkillSchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).default("Intermediate"),
  category: z.string().default(""),
  years: z.string().default(""),
});

const ProjectSchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  description: z.string().default(""),
  tech: z.string().default(""),
  link: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  role: z.string().default(""),
  teamSize: z.string().default(""),
  status: z.enum(["Completed", "In Progress", "Ongoing"]).default("Completed"),
});

const CertificationSchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  link: z.string().default(""),
  description: z.string().default(""),
  expiryDate: z.string().default(""),
  skills: z.string().default(""),
});

const LanguageSchema = z.object({ id: z.number().default(0), name: z.string().default(""), proficiency: z.string().default("Fluent") });
const InterestSchema = z.object({ id: z.number().default(0), name: z.string().default("") });
const AchievementSchema = z.object({ id: z.number().default(0), description: z.string().default("") });
const ReferenceSchema = z.object({ id: z.number().default(0), name: z.string().default(""), company: z.string().default(""), position: z.string().default(""), email: z.string().default(""), phone: z.string().default("") });

const PortfolioSchema = z.object({
  id: z.union([z.number(), z.string()]).default(0),
  title: z.string().default(""),
  description: z.string().default(""),
  url: z.string().default(""),
  type: z.string().default("website"),
});

const ClaimSchema = z.object({
  id: z.union([z.number(), z.string()]).default(0),
  assertionText: z.string().default(""),
  claimType: z.string().default("Skill"),
  sourceActivityId: z.string().default(""),
  confidence: z.number().default(0),
  reasoning: z.string().default(""),
  verificationStatus: z.string().default("suggested"),
  reviewed: z.boolean().default(false),
  accepted: z.boolean().default(false),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const ResumeSchema = z.object({
  name: z.string().default(""),
  title: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  nationality: z.string().default(""),
  pronouns: z.string().default(""),
  summary: z.string().default(""),
  social: SocialLinksSchema.default({ linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" }),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  interests: z.array(InterestSchema).default([]),
  achievements: z.array(AchievementSchema).default([]),
  references: z.array(ReferenceSchema).default([]),
  portfolio: z.array(PortfolioSchema).default([]),
  templateId: z.string().default("template-1"),
  careerStage: z.enum(["student", "recent-graduate", "working-professional", "manager", "freelancer"]).default("working-professional"),
  fontPreference: z.string().default("inter"),
  palettePreference: z.string().default("slate"),
  claims: z.array(ClaimSchema).default([]),
});

/** Parse and validate unknown data into a Resume object with safe defaults */
export function parseResumeJson(data: unknown) {
  const result = ResumeSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    );
    throw new Error(`Invalid resume format:\n${issues.join("\n")}`);
  }
  return result.data;
}

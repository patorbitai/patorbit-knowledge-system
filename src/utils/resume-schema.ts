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

export const ResumeSchema = z.object({
  name: z.string().default(""),
  title: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  nationality: z.string().default(""),
  pronouns: z.string().default(""),
  summary: z.string().default(""),
  social: SocialLinksSchema.default({}),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  templateId: z.string().default("template-1"),
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

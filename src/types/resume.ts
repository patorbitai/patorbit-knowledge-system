/* ============================================================
 * Patorbit – Extended Resume Types
 * ============================================================ */

export interface SocialLinks {
  linkedin: string;
  github: string;
  website: string;
  twitter: string;
  portfolio: string;
  stackoverflow: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  employmentType: string;
  industry: string;
  startDate: string;
  endDate: string;
  current: boolean;
  duration: string;
  description: string;
  achievements: string;
  techUsed: string;
  bulletPoints: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  year: string;
  field: string;
  gpa: string;
  minor: string;
  honors: string;
  activities: string;
  location: string;
}

export interface Skill {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  category: string;
  years: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tech: string;
  link: string;
  startDate: string;
  endDate: string;
  role: string;
  teamSize: string;
  status: "Completed" | "In Progress" | "Ongoing";
  bulletPoints: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
  description: string;
  expiryDate: string;
  skills: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: "Native" | "Fluent" | "Professional" | "Conversational" | "Beginner";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  issuer: string;
}

export interface Interest {
  id: string;
  name: string;
}

export interface Reference {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
}

export interface Portfolio {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "github" | "website" | "dribbble" | "figma" | "other";
}

export interface Resume {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  pronouns: string;
  summary: string;
  social: SocialLinks;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  interests: Interest[];
  achievements: Achievement[];
  references: Reference[];
  portfolio: Portfolio[];
  templateId: string;
}

/** Sections available in the builder navigation */
export type SectionId =
  | "personal"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages"
  | "portfolio"
  | "review";

export interface SectionMeta {
  id: SectionId;
  label: string;
  icon: string;
  description: string;
}

/* ── AI Analysis Types ── */

export interface ATSAnalysis {
  score: number;
  keywordMatch: number;
  missingKeywords: string[];
  formatIssues: string[];
  suggestions: string[];
}

export interface ResumeAnalysis {
  resumeScore: number;
  atsScore: number;
  trustScore: number;
  grammar: number;
  readability: number;
  professionalImpact: number;
  keywordMatch: number;
  missingSections: string[];
  weakBulletPoints: string[];
  weakActionVerbs: string[];
  missingMetrics: string[];
  missingCertifications: string[];
  missingSocialLinks: string[];
  suggestions: Suggestion[];
}

export interface Suggestion {
  id: string;
  section: string;
  field: string;
  original: string;
  suggestion: string;
  type: "improvement" | "rewrite" | "ats" | "grammar" | "impact" | "metric";
}

export interface JobMatchResult {
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendedKeywords: string[];
  suggestions: string[];
}

export type AIActionStatus = "idle" | "loading" | "streaming" | "success" | "error";

export interface AIActionState {
  status: AIActionStatus;
  result: string | null;
  error: string | null;
}

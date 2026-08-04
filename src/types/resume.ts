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

export type CareerStage = "student" | "recent-graduate" | "working-professional" | "manager" | "freelancer";

export const CAREER_STAGES: { value: CareerStage; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Currently enrolled in an academic program" },
  { value: "recent-graduate", label: "Recent Graduate", description: "Graduated within the last 2 years" },
  { value: "working-professional", label: "Working Professional", description: "Employed with 2+ years of experience" },
  { value: "manager", label: "Manager / Leader", description: "Leading teams or organizations" },
  { value: "freelancer", label: "Freelancer / Consultant", description: "Independent contractor or consultant" },
];

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
  careerStage: CareerStage;
  fontPreference?: string;
  palettePreference?: string;
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

/* ── Analysis status ── */

export type AnalysisStatus =
  | "idle"
  | "extracting"
  | "analyzing"
  | "evaluating-ats"
  | "building-graph"
  | "calculating-scores"
  | "complete"
  | "error"
  | "insufficient-data";

export interface AnalysisPhase {
  key: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
}

/* ── AI Analysis Types ── */

export interface ATSAnalysis {
  score: number | null;
  keywordMatch: number | null;
  missingKeywords: string[];
  formatIssues: string[];
  suggestions: string[];
}

/** Resume Score evaluates: grammar, ATS, readability, keywords, structure */
export interface ResumeScoreDetail {
  grammar: number | null;
  readability: number | null;
  keywordMatch: number | null;
  structure: number | null;
  overall: number | null;
}

/** A single trust score component with explanation */
export interface ScoreComponent {
  label: string;
  score: number | null;
  maxScore: number;
  weight: number;
  status: "scored" | "not-applicable" | "missing" | "pending";
  /** Human-readable reason for this component's status */
  explanation: string;
  /** What the user can do to improve this component */
  improvementTip?: string;
  /** Points the user could gain by completing this */
  potentialGain?: number;
}

/** Trust Score with per-stage evaluation and explanations */
export interface TrustScoreDetail {
  /** Which career stage model was used */
  careerStage: CareerStage;
  /** All scored components for this career stage */
  components: ScoreComponent[];
  overall: number | null;
  /** Suggestions specific to trust improvement */
  improvementSuggestions: TrustImprovementSuggestion[];
}

export interface TrustImprovementSuggestion {
  action: string;
  potentialPoints: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export interface Suggestion {
  id: string;
  section: string;
  field: string;
  original: string;
  suggestion: string;
  type: "improvement" | "rewrite" | "ats" | "grammar" | "impact" | "metric";
}

export interface ResumeAnalysis {
  status: AnalysisStatus;
  phases: AnalysisPhase[];
  resumeScore: ResumeScoreDetail;
  trustScore: TrustScoreDetail;
  atsScore: number | null;
  professionalImpact: number | null;
  missingSections: string[];
  weakBulletPoints: string[];
  weakActionVerbs: string[];
  missingMetrics: string[];
  missingCertifications: string[];
  missingSocialLinks: string[];
  suggestions: Suggestion[];
  /** Human-readable reason if analysis couldn't complete */
  dataSufficiencyNote?: string;
}

export function isAnalysisComplete(analysis: ResumeAnalysis | null): boolean {
  return analysis?.status === "complete";
}

export function isAnalysisInProgress(analysis: ResumeAnalysis | null): boolean {
  return !!analysis && ["extracting", "analyzing", "evaluating-ats", "building-graph", "calculating-scores"].includes(analysis.status);
}

export function hasSufficientData(resume: Resume): boolean {
  const hasName = !!resume.name;
  const hasEmail = !!resume.email;
  const hasSummary = !!resume.summary;
  const hasExperience = resume.experience.some((e) => e.company && e.position);
  const hasEducation = resume.education.some((e) => e.school && e.degree);
  const hasSkills = resume.skills.length > 0;
  return (hasName && hasEmail) && (hasSummary || hasExperience || hasEducation || hasSkills);
}

export interface JobMatchResult {
  overallScore: number | null;
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

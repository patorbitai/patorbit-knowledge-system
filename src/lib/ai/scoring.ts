"use strict";

/**
 * Patorbit Deterministic Scoring Engine.
 *
 * This module computes the explainable, career-stage-aware Trust Score and
 * Resume Score. It is fully deterministic, uses no AI, and implements the
 * business logic for what constitutes a trustworthy, complete professional
 * profile at different career stages.
 *
 * The `analyzeResume` action in the AI service layer calls this engine to
 * produce a baseline analysis, then enriches that baseline with qualitative
.
 */
import type {
  Resume,
  ResumeScoreDetail,
  TrustScoreDetail,
  ScoreComponent,
  TrustImprovementSuggestion,
  AnalysisPhase,
  CareerStage,
} from "@/types/resume";

/** Build analysis phases for progress display */
export function buildPhases(): AnalysisPhase[] {
  return [
    { key: "extracting", label: "Extracting Information", status: "pending" },
    { key: "analyzing", label: "Analyzing Resume", status: "pending" },
    { key: "evaluating-ats", label: "Evaluating ATS Compatibility", status: "pending" },
    { key: "building-graph", label: "Building Knowledge Graph", status: "pending" },
    { key: "calculating-scores", label: "Calculating Scores", status: "pending" },
  ];
}

/** Compute real resume score based on actual data */
export function computeResumeScoreDetail(resume: Resume): ResumeScoreDetail {
  // C44.1: Defensive — handle partially hydrated or malformed resume data
  if (!resume) return { grammar: null, readability: null, keywordMatch: null, structure: null, overall: null };
  const hasSummary = !!resume.summary;
  const expCount = resume.experience?.length ?? 0;
  const skillCount = resume.skills?.length ?? 0;
  const eduCount = resume.education?.length ?? 0;

  const grammar = hasSummary ? Math.min(100, 60 + resume.summary.split(" ").length) : null;
  const readability = hasSummary ? Math.min(100, 65 + Math.round(resume.summary.length / 20)) : null;
  const keywordMatch = skillCount > 0 ? Math.min(100, 40 + skillCount * 6) : null;
  const structure = (() => {
    let score = 0;
    if (hasSummary) score += 20;
    if (expCount > 0) score += 30;
    if (eduCount > 0) score += 15;
    if (skillCount > 0) score += 15;
    if ((resume.projects?.length ?? 0) > 0) score += 10;
    if ((resume.certifications?.length ?? 0) > 0) score += 10;
    return score > 0 ? score : null;
  })();

  const scores = [grammar, readability, keywordMatch, structure].filter((s): s is number => s !== null);
  const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return { grammar, readability, keywordMatch, structure, overall };
}

/* ── Stage-Aware Trust Score Engine ── */

interface StageConfig {
  components: {
    key: string;
    label: string;
    maxScore: number;
    weight: number;
    applicable: boolean;
  }[];
}

const stageConfigs: Record<CareerStage, StageConfig> = {
  student: {
    components: [
      { key: "identity", label: "Identity Verification", maxScore: 100, weight: 10, applicable: true },
      { key: "education", label: "Education", maxScore: 100, weight: 25, applicable: true },
      { key: "projects", label: "Projects", maxScore: 100, weight: 20, applicable: true },
      { key: "skills", label: "Skills", maxScore: 100, weight: 15, applicable: true },
      { key: "certifications", label: "Certifications", maxScore: 100, weight: 10, applicable: true },
      { key: "github", label: "GitHub", maxScore: 100, weight: 10, applicable: true },
      { key: "portfolio", label: "Portfolio", maxScore: 100, weight: 10, applicable: true },
      { key: "employment", label: "Employment", maxScore: 100, weight: 0, applicable: false },
      { key: "references", label: "References", maxScore: 100, weight: 0, applicable: false },
    ],
  },
  "recent-graduate": {
    components: [
      { key: "identity", label: "Identity Verification", maxScore: 100, weight: 10, applicable: true },
      { key: "education", label: "Education", maxScore: 100, weight: 20, applicable: true },
      { key: "employment", label: "Employment", maxScore: 100, weight: 15, applicable: true },
      { key: "projects", label: "Projects", maxScore: 100, weight: 15, applicable: true },
      { key: "skills", label: "Skills", maxScore: 100, weight: 15, applicable: true },
      { key: "certifications", label: "Certifications", maxScore: 100, weight: 10, applicable: true },
      { key: "github", label: "GitHub", maxScore: 100, weight: 10, applicable: true },
      { key: "portfolio", label: "Portfolio", maxScore: 100, weight: 5, applicable: true },
      { key: "references", label: "References", maxScore: 100, weight: 0, applicable: false },
    ],
  },
  "working-professional": {
    components: [
      { key: "identity", label: "Identity Verification", maxScore: 100, weight: 15, applicable: true },
      { key: "employment", label: "Employment Evidence", maxScore: 100, weight: 25, applicable: true },
      { key: "education", label: "Education Evidence", maxScore: 100, weight: 10, applicable: true },
      { key: "skills", label: "Skills", maxScore: 100, weight: 15, applicable: true },
      { key: "projects", label: "Projects", maxScore: 100, weight: 10, applicable: true },
      { key: "certifications", label: "Certifications", maxScore: 100, weight: 10, applicable: true },
      { key: "github", label: "GitHub / Portfolio", maxScore: 100, weight: 10, applicable: true },
      { key: "references", label: "References", maxScore: 100, weight: 5, applicable: true },
    ],
  },
  manager: {
    components: [
      { key: "identity", label: "Identity Verification", maxScore: 100, weight: 10, applicable: true },
      { key: "employment", label: "Employment Evidence", maxScore: 100, weight: 25, applicable: true },
      { key: "leadership", label: "Leadership & Promotions", maxScore: 100, weight: 20, applicable: true },
      { key: "education", label: "Education", maxScore: 100, weight: 10, applicable: true },
      { key: "certifications", label: "Certifications", maxScore: 100, weight: 15, applicable: true },
      { key: "references", label: "References", maxScore: 100, weight: 10, applicable: true },
      { key: "github", label: "GitHub / Portfolio", maxScore: 100, weight: 5, applicable: true },
      { key: "contributions", label: "Professional Contributions", maxScore: 100, weight: 5, applicable: true },
    ],
  },
  freelancer: {
    components: [
      { key: "identity", label: "Identity Verification", maxScore: 100, weight: 10, applicable: true },
      { key: "portfolio", label: "Portfolio", maxScore: 100, weight: 20, applicable: true },
      { key: "projects", label: "Projects", maxScore: 100, weight: 20, applicable: true },
      { key: "skills", label: "Skills", maxScore: 100, weight: 15, applicable: true },
      { key: "github", label: "GitHub", maxScore: 100, weight: 10, applicable: true },
      { key: "website", label: "Website / Online Presence", maxScore: 100, weight: 10, applicable: true },
      { key: "certifications", label: "Certifications", maxScore: 100, weight: 10, applicable: true },
      { key: "references", label: "Client References", maxScore: 100, weight: 5, applicable: true },
      { key: "employment", label: "Employment", maxScore: 100, weight: 0, applicable: false },
    ],
  },
};

function scoreIdentity(resume: Resume): ScoreComponent {
  const parts = [];
  let score = 0;
  if (resume.name) { score += 30; parts.push("Name"); }
  if (resume.email) { score += 25; parts.push("Email"); }
  if (resume.phone) { score += 25; parts.push("Phone"); }
  if (resume?.social?.linkedin) { score += 20; parts.push("LinkedIn"); }
  if (score === 0) return { label: "Identity Verification", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No identity information provided.", improvementTip: "Add your name, email, and phone number.", potentialGain: 100 };
  return { label: "Identity Verification", score, maxScore: 100, weight: 0, status: "scored", explanation: `Verified: ${parts.join(", ")}.`, improvementTip: score < 100 ? "Add your phone number and LinkedIn to complete identity verification." : undefined, potentialGain: score < 100 ? 100 - score : undefined };
}

function scoreEducation(resume: Resume): ScoreComponent {
  const edu = resume.education;
  if (edu.length === 0) return { label: "Education", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No education entries.", improvementTip: "Add your educational background.", potentialGain: 100 };
  const scored = edu.some((e) => e.school && e.degree) ? Math.min(100, 40 + edu.length * 15 + (edu.some((e) => e.gpa) ? 10 : 0) + (edu.some((e) => e.honors) ? 10 : 0)) : null;
  return { label: "Education", score: scored, maxScore: 100, weight: 0, status: scored ? "scored" : "missing", explanation: scored ? `${edu.length} degree(s) listed.` : "Incomplete education entries.", improvementTip: scored && scored < 100 ? "Add GPA, honors, or activities for a complete education profile." : "Add your school, degree, and field of study.", potentialGain: scored ? Math.max(0, 100 - scored) : 100 };
}

function scoreEmployment(resume: Resume): ScoreComponent {
  const exp = resume.experience;
  if (exp.length === 0) return { label: "Employment", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No employment history.", improvementTip: "Add your work experience.", potentialGain: 100 };
  const validExps = exp.filter((e) => e.company && e.position);
  const hasMetrics = exp.some((e) => /\d/.test(e.description || "") || (e.bulletPoints?.length ?? 0) > 0);
  const score = validExps.length > 0 ? Math.min(100, 20 + validExps.length * 15 + (hasMetrics ? 15 : 0) + (exp.some((e) => e.current) ? 10 : 0)) : null;
  return { label: "Employment", score, maxScore: 100, weight: 0, status: score ? "scored" : "missing", explanation: score ? `${validExps.length} position(s) with details.` : "Employment entries incomplete.", improvementTip: score && score < 100 ? "Add metrics and achievements to your experience entries." : "Complete company name and position for each entry.", potentialGain: score ? Math.max(0, 100 - score) : 100 };
}

function scoreProjects(resume: Resume): ScoreComponent {
  const projs = resume.projects;
  if (projs.length === 0) return { label: "Projects", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No projects listed.", improvementTip: "Add projects to showcase your skills.", potentialGain: 100 };
  const hasDesc = projs.some((p) => p.description);
  const score = Math.min(100, 30 + projs.length * 10 + (hasDesc ? 20 : 0) + (projs.some((p) => p.link) ? 10 : 0));
  return { label: "Projects", score, maxScore: 100, weight: 0, status: "scored", explanation: `${projs.length} project(s) listed.`, improvementTip: score < 100 ? "Add descriptions and links to your projects." : undefined, potentialGain: Math.max(0, 100 - score) };
}

function scoreSkills(resume: Resume): ScoreComponent {
  const skills = resume.skills;
  if (skills.length === 0) return { label: "Skills", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No skills added.", improvementTip: "Add your technical and professional skills.", potentialGain: 100 };
  const withLevel = skills.filter((s) => s.level !== "Intermediate" || s.name).length;
  const score = Math.min(100, 20 + Math.min(skills.length * 5, 40) + Math.min(withLevel * 3, 20) + (skills.some((s) => s.category) ? 10 : 0));
  return { label: "Skills", score, maxScore: 100, weight: 0, status: "scored", explanation: `${skills.length} skill(s) listed.`, improvementTip: score < 100 ? "Add proficiency levels and categories to your skills." : undefined, potentialGain: Math.max(0, 100 - score) };
}

function scoreCertifications(resume: Resume): ScoreComponent {
  const certs = resume.certifications;
  if (certs.length === 0) return { label: "Certifications", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No certifications.", improvementTip: "Add relevant certifications to boost credibility.", potentialGain: 100 };
  const score = Math.min(100, 30 + certs.length * 15 + (certs.some((c) => c.link) ? 15 : 0));
  return { label: "Certifications", score, maxScore: 100, weight: 0, status: "scored", explanation: `${certs.length} certification(s).`, improvementTip: score < 100 ? "Add credential links to your certifications." : undefined, potentialGain: Math.max(0, 100 - score) };
}

function scoreGitHub(resume: Resume): ScoreComponent {
  const hasGH = !!resume.social.github;
  const hasPortfolio = !!resume.social.website || !!resume.social.portfolio;
  const projects = resume.projects.length;
  if (!hasGH && !hasPortfolio && projects === 0) return { label: "GitHub / Portfolio", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No GitHub, portfolio, or projects.", improvementTip: "Connect your GitHub account or add a portfolio link.", potentialGain: 100 };
  let score = 0;
  if (hasGH) score += 40;
  if (hasPortfolio) score += 30;
  if (projects > 0) score += Math.min(projects * 5, 30);
  return { label: "GitHub / Portfolio", score, maxScore: 100, weight: 0, status: "scored", explanation: `${hasGH ? "GitHub connected. " : ""}${hasPortfolio ? "Portfolio linked. " : ""}${projects > 0 ? `${projects} project(s) on resume.` : ""}`.trim(), improvementTip: score < 100 ? "Complete your GitHub profile with pinned repositories." : undefined, potentialGain: Math.max(0, 100 - score) };
}

function scoreReferences(resume: Resume): ScoreComponent {
  const refs = resume.references;
  if (refs.length === 0) return { label: "References", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No references.", improvementTip: "Add professional references.", potentialGain: 100 };
  const score = Math.min(100, 20 + refs.length * 20);
  return { label: "References", score, maxScore: 100, weight: 0, status: "scored", explanation: `${refs.length} reference(s).`, improvementTip: undefined, potentialGain: Math.max(0, 100 - score) };
}

function scoreLeadership(resume: Resume): ScoreComponent {
  const exp = resume.experience;
  const totalYears = exp.filter((e) => e.position && e.duration).length;
  const hasManager = exp.some((e) => /manager|lead|head|director|chief|principal/i.test(e.position));
  const hasPromotions = exp.some((e) => e.achievements && /\bpromot\b|lead\b.*team|managed|mentor/i.test(e.achievements));
  if (totalYears === 0) return { label: "Leadership & Promotions", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No employment data to evaluate leadership.", improvementTip: "Add experience entries with leadership roles.", potentialGain: 100 };
  let score = 0;
  if (hasManager) score += 40;
  if (hasPromotions) score += 30;
  score += Math.min(totalYears * 10, 30);
  return { label: "Leadership & Promotions", score, maxScore: 100, weight: 0, status: "scored", explanation: hasManager ? "Managerial role identified." : "No explicit leadership roles yet.", improvementTip: score < 100 ? "Highlight team management and mentoring in your experience." : undefined, potentialGain: Math.max(0, 100 - score) };
}

function scoreContributions(resume: Resume): ScoreComponent {
  const hasSpeaking = resume.achievements.some((a) => /speak|talk|present|conference|workshop/i.test(a.title + a.description));
  const hasWriting = resume.achievements.some((a) => /blog|article|publication|paper|write/i.test(a.title + a.description));
  if (!hasSpeaking && !hasWriting) return { label: "Professional Contributions", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No speaking, writing, or community contributions listed.", improvementTip: "Add talks, publications, or community contributions.", potentialGain: 100 };
  const score = (hasSpeaking ? 50 : 0) + (hasWriting ? 50 : 0);
  return { label: "Professional Contributions", score, maxScore: 100, weight: 0, status: "scored", explanation: `${hasSpeaking ? "Speaking engagements. " : ""}${hasWriting ? "Publications. " : ""}`.trim(), improvementTip: score < 100 ? "Consider speaking at conferences or writing technical articles." : undefined, potentialGain: Math.max(0, 100 - score) };
}

function scorePortfolio(resume: Resume): ScoreComponent {
  const items = resume.portfolio;
  if (items.length === 0 && !resume.social.website) return { label: "Portfolio", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No portfolio items.", improvementTip: "Add links to your work samples and projects.", potentialGain: 100 };
  let score = 0;
  if (resume.social.website) score += 30;
  score += Math.min(items.length * 15, 70);
  return { label: "Portfolio", score, maxScore: 100, weight: 0, status: "scored", explanation: `${items.length} portfolio item(s).`, improvementTip: score < 100 ? "Add more portfolio items to showcase your best work." : undefined, potentialGain: Math.max(0, 100 - score) };
}

function scoreWebsite(resume: Resume): ScoreComponent {
  const hasWebsite = !!resume.social.website;
  const hasLinkedIn = !!resume.social.linkedin;
  if (!hasWebsite && !hasLinkedIn) return { label: "Website / Online Presence", score: null, maxScore: 100, weight: 0, status: "missing", explanation: "No website or professional social profiles.", improvementTip: "Add your website and LinkedIn profile.", potentialGain: 100 };
  const score = (hasWebsite ? 50 : 0) + (hasLinkedIn ? 50 : 0);
  return { label: "Website / Online Presence", score, maxScore: 100, weight: 0, status: "scored", explanation: `${hasWebsite ? "Website. " : ""}${hasLinkedIn ? "LinkedIn. " : ""}`.trim(), improvementTip: score < 100 ? "Add both a personal website and LinkedIn for maximum visibility." : undefined, potentialGain: Math.max(0, 100 - score) };
}

const scorers: Record<string, (resume: Resume) => ScoreComponent> = {
  identity: scoreIdentity,
  education: scoreEducation,
  employment: scoreEmployment,
  projects: scoreProjects,
  skills: scoreSkills,
  certifications: scoreCertifications,
  github: scoreGitHub,
  references: scoreReferences,
  leadership: scoreLeadership,
  contributions: scoreContributions,
  portfolio: scorePortfolio,
  website: scoreWebsite,
};

/** Compute stage-aware trust score with full explanations */
export function computeTrustScoreDetail(resume: Resume): TrustScoreDetail {
  // C44.1: Defensive — handle partially hydrated or malformed resume data
  if (!resume) return { careerStage: "working-professional", components: [], overall: null, improvementSuggestions: [] };
  const stage = resume.careerStage || "working-professional";
  const config = stageConfigs[stage];
  if (!config) return { careerStage: "working-professional", components: [], overall: null, improvementSuggestions: [] };

  const components: ScoreComponent[] = config.components.map((comp) => {
    if (!comp.applicable) {
      return { label: comp.label, score: null, maxScore: comp.maxScore, weight: 0, status: "not-applicable", explanation: "Not applicable for your career stage." };
    }
    const scorer = scorers[comp.key];
    if (!scorer) return { label: comp.label, score: null, maxScore: comp.maxScore, weight: 0, status: "pending", explanation: "Evaluation not available." };
    // C44.1: Wrap individual scorer in try-catch to prevent one scorer from crashing the whole trust score
    try {
      return scorer(resume);
    } catch {
      return { label: comp.label, score: null, maxScore: comp.maxScore, weight: 0, status: "pending", explanation: "Evaluation temporarily unavailable." };
    }
  });

  // Calculate weighted overall
  let totalWeight = 0;
  let weightedSum = 0;
  for (const comp of components) {
    if (comp.status === "scored" && comp.score !== null) {
      const cfg = config.components.find((c) => c.label === comp.label);
      const weight = cfg?.weight ?? 1;
      totalWeight += weight;
      weightedSum += comp.score * weight;
    }
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

  // Compute improvement suggestions
  const improvementSuggestions: TrustImprovementSuggestion[] = components
    .filter((c) => c.status !== "not-applicable" && c.potentialGain && c.potentialGain > 0)
    .map((c) => ({
      action: c.improvementTip || `Complete ${c.label.toLowerCase()}.`,
      potentialPoints: Math.round((c.potentialGain ?? 0) * (c.weight > 0 ? c.weight / 100 : 0.1)),
      difficulty: c.status === "missing" ? "easy" : "medium" as "easy" | "medium" | "hard",
      category: c.label,
    }))
    .filter((s) => s.potentialPoints > 0)
    .sort((a, b) => b.potentialPoints - a.potentialPoints);

  return { careerStage: stage, components, overall, improvementSuggestions };
}
"use strict";

import type { GraphService } from "./graph-service";
import type { SkillNode, ProjectNode, RoleNode } from "@/types/knowledge-graph";

/**
 * Insight Service — deterministic analysis of the graph.
 *
 * This is the third layer. It consumes the GraphService to produce
 * actionable, rule-based insights. No LLM calls, no probabilistic
 * reasoning — just deterministic analyses that can be explained
 * and tested.
 *
 * Layer: Insights = Deterministic analysis
 */
export class InsightService {
  private graph: GraphService;

  constructor(graphService: GraphService) {
    this.graph = graphService;
  }

  // -----------------------------------------------------------------
  //  ATS Insights
  // -----------------------------------------------------------------

  /** ATS compatibility analysis based on graph structure. */
  getATSInsights(): {
    score: number | null;
    keywordDensity: number;
    sectionCoverage: Array<{ section: string; present: boolean }>;
    missingKeywords: string[];
    formatScore: number;
    recommendations: string[];
  } {
    const profile = this.graph.getProfile();
    const roles = this.graph.findRoles();
    const skills = this.graph.findSkills();
    const edu = this.graph.findEducations();
    const certs = this.graph.findCertifications();
    const projects = this.graph.findProjects();

    const sections: Array<{ section: string; present: boolean }> = [
      { section: "Summary", present: !!profile.summary },
      { section: "Experience", present: roles.length > 0 },
      { section: "Education", present: edu.length > 0 },
      { section: "Skills", present: skills.length > 0 },
      { section: "Projects", present: projects.length > 0 },
      { section: "Certifications", present: certs.length > 0 },
    ];
    const presentSections = sections.filter((s) => s.present).length;
    const sectionScore = (presentSections / sections.length) * 40;

    // Keyword density: skills mentioned in roles (via USED_SKILL edges)
    const skillEdgeCount = this.graph.getEdgesByType("USED_SKILL").length;
    const keywordDensity = skills.length > 0
      ? Math.round((skillEdgeCount / skills.length) * 100)
      : 0;

    // Format score: presence of quantified achievements, current role, org names
    let formatScore = 60;
    if (roles.some((r) => r.isCurrent)) formatScore += 10;
    if (roles.some((r) => this.graph.getEdges(r.id, "WORKED_AT").length > 0)) formatScore += 10;
    if (roles.some((r) => this.graph.getIncomingEdges(r.id, "ACCOMPLISHED").length > 0)) formatScore += 10;
    if (skills.some((s) => s.proficiency !== "Intermediate")) formatScore += 5;
    if (profile.social.linkedin) formatScore += 5;

    // Missing keywords: common ATS terms not in the graph
    const skillLabels = new Set(skills.map((s) => s.label.toLowerCase()));
    const commonKeywords = [
      "leadership", "communication", "problem solving", "project management",
      "team collaboration", "data analysis", "strategic planning", "agile",
    ];
    const missingKeywords = commonKeywords.filter((kw) => {
      return ![...skillLabels].some((sl) => sl.includes(kw));
    });

    const score = Math.min(100, sectionScore + keywordDensity * 0.2 + (formatScore - 60));

    const recommendations: string[] = [];
    if (!profile.summary) recommendations.push("Add a professional summary");
    if (missingKeywords.length > 2) recommendations.push(`Include these ATS keywords: ${missingKeywords.slice(0, 4).join(", ")}`);
    if (!roles.some((r) => r.isCurrent)) recommendations.push("Mark your current role");
    if (!profile.social.linkedin) recommendations.push("Add your LinkedIn profile");
    if (keywordDensity < 30) recommendations.push("Show how you used each skill in specific roles");

    return { score, keywordDensity, sectionCoverage: sections, missingKeywords, formatScore, recommendations };
  }

  // -----------------------------------------------------------------
  //  Skill Insights
  // -----------------------------------------------------------------

  /** Deep analysis of the skill landscape. */
  getSkillInsights(): {
    total: number;
    byCategory: Record<string, number>;
    byProficiency: Record<string, number>;
    mostUsed: string[];
    unusedSkills: string[];
    duplicateSkills: Array<{ duplicates: string[]; suggestion: string }>;
    gaps: string[];
  } {
    const skills = this.graph.findSkills();

    // By category
    const byCategory: Record<string, number> = {};
    for (const s of skills) {
      const cat = s.category || "Uncategorized";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    // By proficiency
    const byProficiency: Record<string, number> = {};
    for (const s of skills) {
      byProficiency[s.proficiency] = (byProficiency[s.proficiency] ?? 0) + 1;
    }

    // Most used (skills connected to most roles/projects)
    const usageCount = new Map<string, number>();
    for (const s of skills) {
      const edges = this.graph.getEdges(s.id, "USED_SKILL");
      usageCount.set(s.id, edges.length);
    }
    const mostUsed = [...usageCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => skills.find((s) => s.id === id)?.label ?? id);

    // Unused skills (never connected via USED_SKILL)
    const unusedSkills = skills
      .filter((s) => (usageCount.get(s.id) ?? 0) === 0)
      .map((s) => s.label);

    // Duplicate skills (fuzzy name matching)
    const duplicateSkills: Array<{ duplicates: string[]; suggestion: string }> = [];
    const normalized = skills.map((s) => ({ ...s, norm: s.label.toLowerCase().trim() }));
    const seen = new Map<string, string[]>();
    for (const s of normalized) {
      // Check different normalizations
      const variants = [s.norm, s.norm.replace(/[-/]/g, " "), s.norm.replace(/\s+/g, "")];
      let matched = false;
      for (const v of variants) {
        if (seen.has(v)) {
          seen.get(v)!.push(s.label);
          matched = true;
          break;
        }
      }
      if (!matched) {
        seen.set(s.norm, [s.label]);
      }
    }
    for (const [, group] of seen) {
      if (group.length > 1) {
        duplicateSkills.push({
          duplicates: group,
          suggestion: `Merge "${group.slice(1).join('", "')}" into "${group[0]}"`,
        });
      }
    }

    // Gaps: common industry skills not present
    const allLabels = new Set(skills.map((s) => s.label.toLowerCase()));
    const commonGaps = [
      "Git", "Agile", "CI/CD", "REST APIs", "Cloud", "Docker",
      "SQL", "Communication", "Leadership",
    ];
    const gaps = commonGaps.filter((g) => ![...allLabels].some((l) => l.includes(g.toLowerCase())));

    return { total: skills.length, byCategory, byProficiency, mostUsed, unusedSkills, duplicateSkills, gaps };
  }

  // -----------------------------------------------------------------
  //  Career Insights
  // -----------------------------------------------------------------

  /** Career-level analysis from the graph structure. */
  getCareerInsights(): {
    careerStage: string;
    tenureStability: number;
    growthVelocity: number;
    roleProgression: string[];
    industrySummary: string;
    missingCriticalSections: string[];
  } {
    const profile = this.graph.getProfile();
    const roles = this.graph.findRoles();
    const orgs = this.graph.findOrganizations();
    const projects = this.graph.findProjects();
    const certs = this.graph.findCertifications();
    const edu = this.graph.findEducations();

    // Tenure stability: average years per role
    const avgTenure = this.calcAvgTenure(roles);

    // Growth velocity: number of roles / total years
    const totalYears = this.calcTotalYears(roles);
    const velocity = totalYears > 0 ? roles.length / totalYears : 0;

    // Role progression titles
    const progression = roles
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((r) => r.title);

    // Industry summary
    const industries = new Set(orgs.map((o) => o.industry).filter(Boolean));
    const industrySummary = industries.size > 0
      ? [...industries].join(", ")
      : "Not specified";

    // Missing sections
    const missingCriticalSections: string[] = [];
    if (roles.length === 0) missingCriticalSections.push("Experience");
    if (edu.length === 0) missingCriticalSections.push("Education");
    if (this.graph.findSkills().length === 0) missingCriticalSections.push("Skills");
    if (!profile.summary) missingCriticalSections.push("Professional Summary");

    return {
      careerStage: profile.careerStage,
      tenureStability: Math.round(avgTenure * 10) / 10,
      growthVelocity: Math.round(velocity * 100) / 100,
      roleProgression: progression,
      industrySummary,
      missingCriticalSections,
    };
  }

  // -----------------------------------------------------------------
  //  Learning Recommendations
  // -----------------------------------------------------------------

  /** Suggest learning paths based on skill gaps and career trajectory. */
  getLearningRecommendations(): Array<{
    skill: string;
    category: string;
    relevance: number; // 1–10
    reason: string;
  }> {
    const insights = this.getSkillInsights();
    const career = this.getCareerInsights();
    const recommendations: Array<{
      skill: string;
      category: string;
      relevance: number;
      reason: string;
    }> = [];

    const existingLabels = new Set(
      this.graph.findSkills().map((s) => s.label.toLowerCase())
    );

    // Recommendations based on career stage
    const stageRecommendations: Record<string, Array<{ skill: string; category: string; reason: string }>> = {
      student: [
        { skill: "Git", category: "Tools", reason: "Industry-standard version control" },
        { skill: "Agile Methodologies", category: "Process", reason: "Most teams use agile practices" },
        { skill: "Public Speaking", category: "Soft Skills", reason: "Presentations and interviews" },
      ],
      "recent-graduate": [
        { skill: "System Design", category: "Engineering", reason: "Common in technical interviews" },
        { skill: "Project Management", category: "Leadership", reason: "Early-career responsibility indicator" },
      ],
      "working-professional": [
        { skill: "Cross-functional Collaboration", category: "Soft Skills", reason: "Valued at mid-career level" },
        { skill: "Mentoring", category: "Leadership", reason: "Prepares for senior roles" },
      ],
      manager: [
        { skill: "Strategic Planning", category: "Leadership", reason: "Core competency for managers" },
        { skill: "Budget Management", category: "Business", reason: "Expected at senior leadership levels" },
      ],
      freelancer: [
        { skill: "Business Development", category: "Business", reason: "Essential for independent work" },
        { skill: "Client Management", category: "Business", reason: "Key for freelance success" },
      ],
    };

    const stageRecs = stageRecommendations[career.careerStage] ?? [];
    for (const rec of stageRecs) {
      if (!existingLabels.has(rec.skill.toLowerCase())) {
        recommendations.push({ ...rec, relevance: 8 });
      }
    }

    // Address found gaps
    for (const gap of insights.gaps) {
      if (gap.length > 0) {
        recommendations.push({
          skill: gap,
          category: "Skill Gap",
          relevance: 7,
          reason: `Common industry skill not yet in your profile`,
        });
      }
    }

    // Duration-based: if short tenure, recommend stability indicators
    if (career.tenureStability < 1.5 && this.graph.findRoles().length > 1) {
      // Already covered
    }

    return recommendations;
  }

  // -----------------------------------------------------------------
  //  Resume Completeness
  // -----------------------------------------------------------------

  /** Evaluate how complete the resume data is across all sections. */
  getResumeCompleteness(): {
    overall: number; // percentage 0–100
    sections: Array<{
      id: string;
      label: string;
      complete: boolean;
      score: number;
      missing: string[];
    }>;
  } {
    const profile = this.graph.getProfile();
    const roles = this.graph.findRoles();
    const skills = this.graph.findSkills();
    const edu = this.graph.findEducations();
    const projects = this.graph.findProjects();
    const certs = this.graph.findCertifications();
    const lang = this.graph.findLanguages();
    const refs = this.graph.findReferences();
    const portfolio = this.graph.findPortfolios();

    const sections = [
      {
        id: "personal",
        label: "Personal Information",
        complete: !!(profile.label && profile.email),
        score: [profile.label, profile.email, profile.phone, profile.title, profile.summary].filter(Boolean).length * 20,
        missing: [!profile.label && "Name", !profile.email && "Email", !profile.phone && "Phone", !profile.title && "Title", !profile.summary && "Summary"].filter(Boolean) as string[],
      },
      {
        id: "experience",
        label: "Experience",
        complete: roles.length > 0 && roles.some((r) => r.title),
        score: Math.min(100, roles.length * 25 + roles.filter((r) => this.graph.getIncomingEdges(r.id, "ACCOMPLISHED").length > 0).length * 10),
        missing: roles.length === 0 ? ["No experience entries"] : roles.filter((r) => !r.title).map(() => "Missing position titles"),
      },
      {
        id: "education",
        label: "Education",
        complete: edu.length > 0,
        score: Math.min(100, edu.length * 50),
        missing: edu.length === 0 ? ["No education entries"] : [],
      },
      {
        id: "skills",
        label: "Skills",
        complete: skills.length > 0,
        score: Math.min(100, skills.length * 15 + skills.filter((s) => s.category).length * 5),
        missing: skills.length === 0 ? ["No skills listed"] : skills.filter((s) => !s.category).length > 0 ? [`${skills.filter((s) => !s.category).length} skills uncategorized`] : [],
      },
      {
        id: "projects",
        label: "Projects",
        complete: projects.length > 0,
        score: Math.min(100, projects.length * 30 + projects.filter((p) => p.description).length * 10),
        missing: projects.length === 0 ? ["No projects listed"] : [],
      },
      {
        id: "certifications",
        label: "Certifications",
        complete: certs.length > 0,
        score: Math.min(100, certs.length * 50),
        missing: certs.length === 0 ? ["No certifications"] : [],
      },
      {
        id: "languages",
        label: "Languages",
        complete: lang.length > 0,
        score: Math.min(100, lang.length * 50),
        missing: lang.length === 0 ? ["No languages"] : [],
      },
      {
        id: "references",
        label: "References",
        complete: refs.length > 0,
        score: Math.min(100, refs.length * 50),
        missing: refs.length === 0 ? ["No references"] : [],
      },
    ];

    const overall = Math.round(sections.reduce((s, sec) => s + sec.score, 0) / sections.length);

    return { overall, sections };
  }

  // -----------------------------------------------------------------
  //  Private helpers
  // -----------------------------------------------------------------

  private calcAvgTenure(roles: RoleNode[]): number {
    if (roles.length === 0) return 0;
    let total = 0;
    let count = 0;
    for (const r of roles) {
      if (!r.startDate) continue;
      const start = new Date(r.startDate).getTime();
      const end = r.isCurrent ? Date.now() : r.endDate ? new Date(r.endDate).getTime() : Date.now();
      total += (end - start) / (365.25 * 24 * 60 * 60 * 1000);
      count++;
    }
    return count > 0 ? total / count : 0;
  }

  private calcTotalYears(roles: RoleNode[]): number {
    if (roles.length === 0) return 0;
    let min = Infinity;
    let max = 0;
    for (const r of roles) {
      if (r.startDate) {
        const s = new Date(r.startDate).getTime();
        if (s < min) min = s;
      }
      const end = r.isCurrent ? Date.now() : r.endDate ? new Date(r.endDate).getTime() : Date.now();
      if (end > max) max = end;
    }
    return min < Infinity ? (max - min) / (365.25 * 24 * 60 * 60 * 1000) : 0;
  }
}

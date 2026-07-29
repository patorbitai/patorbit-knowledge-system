"use client";

/**
 * AI Service Layer for Resume Builder
 *
 * Production: replace mock implementations with real API calls.
 * The contract (input/output types) stays the same.
 */

import type {
  ResumeAnalysis,
  JobMatchResult,
  Experience,
  Project,
  Resume,
} from "@/types/resume";

/* ── Helpers ── */

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function timelog(label: string): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[AI Service] ${label}`);
  }
}

/* ── Mock delay ── */

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Public API ── */

/** Generate a professional summary based on the current resume data */
export async function generateSummary(
  resume: Resume,
): Promise<{ summary: string }> {
  timelog("generateSummary");
  await delay(800);
  const titles = resume.experience.map((e) => e.position).filter(Boolean);
  const skills = resume.skills.map((s) => s.name).filter(Boolean);
  const topRole = titles[0] || "professional";
  const skillStr = skills.slice(0, 4).join(", ");
  return {
    summary: `Results-driven ${topRole} with ${
      resume.experience.length
    }+ years of experience delivering high-impact solutions. Proven expertise in ${skillStr || "cross-functional collaboration"} with a strong track record of driving measurable business outcomes. Passionate about leveraging data-driven insights and emerging technologies to solve complex challenges. Adept at leading teams, streamlining operations, and fostering innovation in fast-paced environments.${
      resume.education.length
        ? ` Holding a ${resume.education[0]?.degree || "degree"} from ${resume.education[0]?.school || "a leading institution"}.`
        : ""
    }`,
  };
}

/** Rewrite experience description */
export async function rewriteExperience(
  experience: Partial<Experience>,
  tone: "ats" | "impact" | "concise" | "expanded" | "professional",
): Promise<{ description: string; bulletPoints: string[] }> {
  timelog("rewriteExperience");
  await delay(600);

  const role = experience.position || "professional";
  const company = experience.company || "an organization";
  const templates: Record<string, { description: string; bulletPoints: string[] }> = {
    ats: {
      description: `Served as ${role} at ${company}, where key responsibilities included driving strategic initiatives, optimizing operational workflows, and collaborating with cross-functional teams to achieve organizational objectives. Demonstrated expertise in project management, data analysis, and process improvement.`,
      bulletPoints: [
        `Led key initiatives as ${role} at ${company}, resulting in measurable improvements to operational efficiency`,
        `Collaborated with cross-functional teams to drive strategic objectives and streamline workflows`,
        `Utilized data-driven approaches to optimize processes and enhance productivity`,
        `Managed stakeholder relationships and delivered projects within scope and timeline`,
      ],
    },
    impact: {
      description: `As ${role} at ${company}, transformed business operations through strategic leadership and data-informed decision-making. Drove significant improvements in team performance and operational efficiency.`,
      bulletPoints: [
        `Spearheaded initiatives that improved team productivity by 35% and reduced operational costs by 20%`,
        `Led cross-functional teams to deliver complex projects 25% ahead of schedule`,
        `Implemented data-driven strategies that increased revenue by $500K annually`,
        `Mentored 5+ team members, resulting in 3 promotions within the year`,
      ],
    },
    concise: {
      description: `${role} with proven success at ${company} in driving results and improving processes.`,
      bulletPoints: [
        `Delivered measurable improvements in team performance and workflow efficiency`,
        `Managed end-to-end project lifecycle from planning through execution`,
        `Built strong stakeholder relationships across departments`,
      ],
    },
    expanded: {
      description: `In the capacity of ${role} at ${company}, assumed comprehensive ownership of strategic planning, resource allocation, and performance management across multiple concurrent initiatives. Responsibilities encompassed designing and implementing scalable systems, fostering a culture of continuous improvement, and serving as the primary liaison between executive leadership and operational teams. Leveraged extensive domain expertise to identify opportunities for innovation, optimize resource utilization, and drive sustainable growth.`,
      bulletPoints: [
        `Assumed end-to-end ownership of strategic portfolio encompassing 10+ concurrent initiatives valued at over $2M`,
        `Designed and implemented scalable operational frameworks adopted across 4 departments, reducing process inefficiencies by 40%`,
        `Served as primary liaison between executive leadership and cross-functional teams of 20+ members`,
        `Identified and capitalized on market opportunities, resulting in 3 new revenue streams totaling $750K annually`,
        `Fostered culture of continuous improvement through weekly retrospectives and data-driven OKR tracking`,
        `Negotiated vendor contracts that reduced annual operational expenses by 18% while improving service levels`,
        `Developed comprehensive training program that reduced new-hire ramp time by 50%`,
        `Presented quarterly business reviews to C-suite stakeholders with actionable recommendations`,
      ],
    },
    professional: {
      description: `Experienced ${role} with a demonstrated history of working at ${company}. Skilled in strategic planning, team leadership, and operational excellence. Strong professional background with a focus on delivering high-quality results.`,
      bulletPoints: [
        `Demonstrated strong leadership capabilities in managing complex projects and diverse teams`,
        `Exhibited excellence in strategic planning and execution of key business initiatives`,
        `Maintained high standards of quality and professionalism in all deliverables`,
        `Built and maintained productive relationships with clients, stakeholders, and team members`,
      ],
    },
  };

  return templates[tone] || templates.professional;
}

/** Generate project description */
export async function generateProjectDescription(
  project: Partial<Project>,
): Promise<{ description: string; bulletPoints: string[] }> {
  timelog("generateProjectDescription");
  await delay(700);
  const name = project.name || "this project";
  const tech = project.tech || "modern technologies";
  return {
    description: `Developed ${name} using ${tech}, delivering a robust solution that addressed key user needs and business requirements.`,
    bulletPoints: [
      `Architected and implemented ${name} using ${tech}, achieving 99.9% uptime`,
      `Reduced processing time by 40% through optimized algorithm design`,
      `Built responsive, accessible UI with comprehensive test coverage`,
      `Integrated with RESTful APIs and third-party services for enhanced functionality`,
    ],
  };
}

/** Suggest missing skills based on resume content */
export async function suggestMissingSkills(
  resume: Resume,
): Promise<{ suggestions: string[] }> {
  timelog("suggestMissingSkills");
  await delay(500);
  const allSkills = new Set(resume.skills.map((s) => s.name.toLowerCase()));

  const skillPool = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL",
    "AWS", "Docker", "Kubernetes", "Git", "CI/CD", "REST APIs",
    "GraphQL", "Machine Learning", "Data Analysis", "Agile",
    "Project Management", "Leadership", "Communication",
    "Problem Solving", "Critical Thinking", "Team Collaboration",
  ];

  const suggested = skillPool.filter(
    (s) => !allSkills.has(s.toLowerCase()),
  );

  return { suggestions: suggested.slice(0, 6) };
}

/** Generate quantified achievements for a role */
export async function generateQuantifiedAchievements(
  experience: Partial<Experience>,
): Promise<{ bulletPoints: string[] }> {
  timelog("generateQuantifiedAchievements");
  await delay(800);
  return {
    bulletPoints: [
      `Drove a 40% increase in efficiency through process optimization at ${experience.company || "the organization"}`,
      `Reduced operational costs by 25% ($200K annual savings) through strategic resource allocation`,
      `Led a team of 8 to deliver critical project 30% ahead of deadline`,
      `Improved customer satisfaction scores by 35 points (to 94%)`,
      `Generated $1.2M in new revenue through strategic partnerships`,
    ],
  };
}

/** Improve bullet points with stronger action verbs and metrics */
export async function improveBulletPoints(
  bulletPoints: string[],
): Promise<{ bulletPoints: string[] }> {
  timelog("improveBulletPoints");
  await delay(600);
  return {
    bulletPoints: bulletPoints.map((bp) => {
      if (!bp) return bp;
      const improved = bp
        .replace(/^Worked on /i, "Engineered ")
        .replace(/^Helped with /i, "Contributed to ")
        .replace(/^Responsible for /i, "Led ")
        .replace(/^Was involved in /i, "Participated in ")
        .replace(/^Did /i, "Executed ")
        .replace(/^Made /i, "Developed ")
        .replace(/\.?$/, ", achieving measurable improvements.");
      return improved;
    }),
  };
}

/** Grammar and professional tone correction */
export async function grammarCorrect(
  text: string,
): Promise<{ corrected: string; changes: string[] }> {
  timelog("grammarCorrect");
  await delay(400);
  // Simple mock: minimal corrections
  return {
    corrected: text
      .replace(/\btheir\b/g, "their")
      .replace(/\bteh\b/g, "the")
      .replace(/\bthier\b/g, "their")
      .replace(/\bi\b/g, "I")
      .replace(/\bcant\b/g, "can't")
      .replace(/\bdont\b/g, "don't"),
    changes: ["Minor grammar and style improvements applied"],
  };
}

/** Full resume analysis – the main AI analysis endpoint */
export async function analyzeResume(
  resume: Resume,
): Promise<ResumeAnalysis> {
  timelog("analyzeResume");
  await delay(1200);

  const hasSummary = !!resume.summary;
  const expCount = resume.experience.length;
  const eduCount = resume.education.length;
  const skillCount = resume.skills.length;
  const hasLinkedIn = !!resume.social.linkedin;
  const hasGitHub = !!resume.social.github;
  const hasPortfolio = !!resume.social.portfolio;

  const missingSections: string[] = [];
  if (!hasSummary) missingSections.push("Professional Summary");
  if (expCount === 0) missingSections.push("Experience");
  if (expCount < 2) missingSections.push("More Experience (2+ roles recommended)");
  if (eduCount === 0) missingSections.push("Education");
  if (skillCount < 5) missingSections.push("More Skills (5+ recommended)");
  if (!hasLinkedIn) missingSections.push("LinkedIn Profile");
  if (!hasGitHub) missingSections.push("GitHub Profile");

  const baseScore = randomInRange(45, 92);
  const atsScore = randomInRange(40, 88);
  const trustScore = randomInRange(50, 95);
  const grammar = randomInRange(65, 100);
  const readability = randomInRange(60, 95);
  const professionalImpact = randomInRange(50, 90);
  const keywordMatch = randomInRange(35, 85);

  return {
    resumeScore: baseScore,
    atsScore,
    trustScore,
    grammar,
    readability,
    professionalImpact,
    keywordMatch,
    missingSections,
    weakBulletPoints: expCount > 0
      ? [
          "Some bullet points lack quantified metrics",
          "Consider stronger action verbs (led, engineered, delivered)",
          "Add specific technologies and tools used",
        ]
      : [],
    weakActionVerbs: expCount > 0
      ? ["Worked", "Helped", "Did", "Was", "Had"]
      : [],
    missingMetrics: expCount > 0
      ? ["Consider adding: % improvements, $ amounts, time saved, team sizes"]
      : [],
    missingCertifications: resume.certifications.length === 0
      ? ["No certifications listed — relevant certs can boost credibility"]
      : [],
    missingSocialLinks: !hasLinkedIn || !hasGitHub
      ? [
          ...(!hasLinkedIn ? ["LinkedIn"] : []),
          ...(!hasGitHub ? ["GitHub"] : []),
          ...(!hasPortfolio ? ["Portfolio"] : []),
        ]
      : [],
    suggestions: [
      {
        id: "sug-1",
        section: "summary",
        field: "summary",
        original: resume.summary || "No summary provided",
        suggestion: hasSummary
          ? "Your summary is good! Consider adding more quantifiable achievements."
          : "Add a professional summary highlighting your key achievements and career trajectory.",
        type: "improvement",
      },
      {
        id: "sug-2",
        section: "experience",
        field: "description",
        original: "",
        suggestion: "Add metrics to your bullet points (e.g., 'Improved efficiency by 35%') to boost ATS scores.",
        type: "ats",
      },
      {
        id: "sug-3",
        section: "skills",
        field: "name",
        original: "",
        suggestion: "Consider adding cloud/platform skills (AWS, Azure, GCP) to improve keyword matching.",
        type: "rewrite",
      },
    ],
  };
}

/** Match resume against a job description */
export async function matchJobDescription(
  resume: Resume,
  jobDescription: string,
): Promise<JobMatchResult> {
  timelog("matchJobDescription");
  await delay(1000);

  const resumeSkills = resume.skills.map((s) => s.name.toLowerCase());
  const resumeTech = resume.experience
    .flatMap((e) => (e.techUsed || "").split(",").map((t) => t.trim().toLowerCase()))
    .concat(resume.projects.flatMap((p) => (p.tech || "").split(",").map((t) => t.trim().toLowerCase())));

  const allResumeKeywords = new Set([...resumeSkills, ...resumeTech]);

  // Extract potential keywords from job description (mock)
  const jdKeywords = [
    "Python", "TypeScript", "React", "AWS", "Docker", "Machine Learning",
    "Leadership", "Communication", "Agile", "Project Management", "SQL",
    "GraphQL", "Kubernetes", "CI/CD", "Data Analysis",
  ];

  const matched = jdKeywords.filter((k) =>
    allResumeKeywords.has(k.toLowerCase()),
  );
  const missing = jdKeywords.filter(
    (k) => !allResumeKeywords.has(k.toLowerCase()),
  );

  const overallScore = Math.round(
    (matched.length / Math.max(jdKeywords.length, 1)) * 100,
  );

  return {
    overallScore,
    matchedSkills: matched,
    missingSkills: missing,
    recommendedKeywords: missing,
    suggestions: missing.length > 0
      ? [
          `Add skills: ${missing.slice(0, 4).join(", ")} to improve match`,
          "Tailor your summary to include keywords from the job description",
          "Highlight relevant experience that aligns with the role",
        ]
      : ["Your profile is well-aligned with this role!"],
  };
}

/** Optimize entire resume for a specific job */
export async function optimizeForJob(
  resume: Resume,
  jobDescription: string,
  targetRole: string,
): Promise<{ summary: string; suggestions: string[] }> {
  timelog("optimizeForJob");
  await delay(1500);
  return {
    summary: `Results-driven ${targetRole} with expertise in delivering enterprise-scale solutions. Proven track record of leveraging cutting-edge technologies to drive business growth and operational excellence. Adept at leading cross-functional teams and implementing data-driven strategies that deliver measurable impact.`,
    suggestions: [
      "Update your summary to emphasize the specific requirements of this role",
      "Reorder experience to highlight the most relevant positions first",
      "Adjust skill emphasis toward the technologies mentioned in the job description",
      "Add quantifiable achievements that align with the role's KPIs",
    ],
  };
}

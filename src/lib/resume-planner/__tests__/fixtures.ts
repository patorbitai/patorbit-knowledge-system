"use strict";

/**
 * §25/§26 fixtures — realistic profiles across career sizes and
 * representative job descriptions across job types. Used by planner tests
 * and available for visual acceptance runs.
 */

import type { QualificationMatch } from "@/types/qualification-match";
import type { Resume } from "@/types/resume";

const EMPTY_SOCIAL = {
  linkedin: "",
  github: "",
  website: "",
  twitter: "",
  portfolio: "",
  stackoverflow: "",
};

export function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    name: "",
    title: "",
    email: "",
    phone: "",
    address: "",
    nationality: "",
    pronouns: "",
    summary: "",
    social: { ...EMPTY_SOCIAL },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
    achievements: [],
    references: [],
    portfolio: [],
    templateId: "modern-clean",
    careerStage: "working-professional",
    claims: [],
    ...overrides,
  };
}

function exp(
  id: string,
  company: string,
  position: string,
  years: string,
  bullets: string[],
  techUsed = "",
): Resume["experience"][number] {
  return {
    id,
    company,
    position,
    location: "Remote",
    employmentType: "Full-time",
    industry: "Technology",
    startDate: years.split("–")[0] ?? "",
    endDate: years.split("–")[1] ?? "",
    current: years.includes("Present"),
    duration: years,
    description: "",
    achievements: "",
    techUsed,
    bulletPoints: bullets,
  };
}

function skill(name: string, category: string) {
  return {
    id: `sk-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    level: "Advanced" as const,
    category,
    years: "3",
  };
}

function edu(id: string, school: string, degree: string, field: string, year: string, gpa = ""): Resume["education"][number] {
  return {
    id,
    school,
    degree,
    year,
    field,
    gpa,
    minor: "",
    honors: "",
    activities: "",
    location: "",
  };
}

/* ── §25 profile fixtures ─────────────────────────────────────────────── */

/** Early career: 1 role, education-heavy, few skills. */
export const EARLY_CAREER: Resume = makeResume({
  name: "Priya Shah",
  title: "Junior Data Analyst",
  email: "priya@example.com",
  phone: "+1 555 0100",
  summary:
    "Recent analytics graduate focused on turning messy datasets into clear decisions. One year of hands-on reporting experience.",
  careerStage: "recent-graduate",
  experience: [
    exp(
      "e1",
      "Nimbus Retail",
      "Junior Data Analyst",
      "2024–Present",
      [
        "Built weekly SQL reports for the merchandising team",
        "Cleaned and validated nightly sales exports in Python",
        "Created dashboards that cut manual reporting time by 5 hours per week",
      ],
      "SQL, Python, Tableau",
    ),
  ],
  education: [
    edu("ed1", "State University", "BSc", "Business Analytics", "2024", "3.8"),
  ],
  skills: [
    skill("SQL", "Databases"),
    skill("Python", "Languages"),
    skill("Tableau", "Tools"),
    skill("Excel", "Tools"),
    skill("Data Visualization", "Tools"),
  ],
  interests: [{ id: "i1", name: "Chess" }, { id: "i2", name: "Trail running" }],
});

/** Mid-career: 5 roles, multiple skills, projects + certifications. */
export const MID_CAREER: Resume = makeResume({
  name: "Marcus Green",
  title: "Senior Product Manager",
  email: "marcus@example.com",
  phone: "+1 555 0111",
  summary:
    "Product manager with 7 years building B2B SaaS products from discovery through launch.",
  experience: [
    exp("e1", "Orbit Labs", "Senior Product Manager", "2023–Present", [
      "Owned the platform roadmap across 3 squads",
      "Launched self-serve onboarding that improved activation by 18%",
      "Ran quarterly planning with engineering and design leadership",
      "Defined and tracked OKRs for the platform group",
    ]),
    exp("e2", "Finlytics", "Product Manager", "2021–2023", [
      "Shipped billing and invoicing modules used by 12k customers",
      "Reduced churn 9% via a redesigned renewal flow",
      "Partnered with data science on usage-based pricing",
    ]),
    exp("e3", "Finlytics", "Associate Product Manager", "2020–2021", [
      "Managed the mobile app backlog",
      "Ran 40+ customer interviews",
    ]),
    exp("e4", "Brightpath", "Business Analyst", "2018–2020", [
      "Built financial models for pricing decisions",
      "Automated weekly reporting in SQL",
    ]),
    exp("e5", "Brightpath", "Operations Intern", "2018", [
      "Supported vendor onboarding process improvements",
    ]),
  ],
  education: [edu("ed1", "State University", "BBA", "Finance", "2018")],
  skills: [
    skill("Roadmapping", "Product"),
    skill("A/B Testing", "Product"),
    skill("SQL", "Databases"),
    skill("Analytics", "Product"),
    skill("Figma", "Tools"),
    skill("Stakeholder Management", "Product"),
  ],
  projects: [
    {
      id: "p1",
      name: "Pricing Simulator",
      description: "Internal tool modeling discount scenarios",
      tech: "Python, Streamlit",
      link: "",
      startDate: "",
      endDate: "",
      role: "PM",
      teamSize: "3",
      status: "Completed",
      bulletPoints: [],
    },
  ],
  certifications: [
    {
      id: "c1",
      name: "Certified Scrum Product Owner",
      issuer: "Scrum Alliance",
      date: "2022",
      link: "",
      description: "",
      expiryDate: "",
      skills: "Scrum",
    },
  ],
  achievements: [
    { id: "a1", title: "Activation lift", description: "Self-serve onboarding improved activation 18%", date: "2024", issuer: "Orbit Labs" },
  ],
  interests: [{ id: "i1", name: "Photography" }],
});

/** Senior: 8+ roles, leadership-heavy, many achievements. */
export const SENIOR: Resume = makeResume({
  name: "Elena Ortiz",
  title: "Director of Engineering",
  email: "elena@example.com",
  phone: "+1 555 0122",
  summary:
    "Engineering leader with 14 years across startups and scale-ups, managing managers and multi-team programs.",
  experience: Array.from({ length: 8 }, (_, i) =>
    exp(
      `e${i + 1}`,
      `Company ${i + 1}`,
      i < 2 ? "Director of Engineering" : i < 4 ? "Engineering Manager" : "Senior Software Engineer",
      `${2024 - i * 2}–Present`,
      [
        `Led ${6 + i * 3} engineers delivering platform services`,
        "Improved deployment frequency from monthly to daily",
        "Mentored engineers into senior and lead roles",
        "Owned hiring pipeline and interview design",
        "Drove reliability program reducing incidents 40%",
        "Partnered with product on quarterly roadmaps",
        "Introduced architecture review process",
      ],
    ),
  ),
  education: [edu("ed1", "Tech Institute", "MS", "Computer Science", "2012"), edu("ed2", "Tech Institute", "BS", "Computer Science", "2010")],
  skills: [
    skill("Leadership", "Leadership"),
    skill("System Design", "Architecture"),
    skill("Hiring", "Leadership"),
    skill("Kubernetes", "Cloud"),
    skill("Go", "Languages"),
  ],
  achievements: [
    { id: "a1", title: "VP Engineering Award", description: "Company-wide leadership recognition", date: "2023", issuer: "Company 1" },
    { id: "a2", title: "Conference keynote", description: "Spoke on platform migration at ScaleConf", date: "2022", issuer: "ScaleConf" },
  ],
  interests: [{ id: "i1", name: "Mentoring" }],
});

/** Technical: large skills inventory, projects, certifications. */
export const TECHNICAL: Resume = makeResume({
  name: "Dmitri Volkov",
  title: "Staff Software Engineer",
  email: "dmitri@example.com",
  phone: "+1 555 0133",
  summary: "Staff engineer specializing in distributed systems and developer platforms.",
  experience: [
    exp("e1", "Streamcore", "Staff Software Engineer", "2022–Present", [
      "Designed event-driven pipeline processing 2B events/day",
      "Reduced p99 latency 45% through backpressure redesign",
      "Led migration of 60 services to Kubernetes",
      "Built internal deployment CLI used by 200 engineers",
    ], "Go, Kafka, Kubernetes"),
    exp("e2", "Streamcore", "Senior Software Engineer", "2020–2022", [
      "Owned the streaming ingestion service",
      "Introduced contract testing across 12 teams",
    ], "Go, gRPC"),
    exp("e3", "Devbox", "Software Engineer", "2018–2020", [
      "Built multi-tenant billing integrations",
      "Shipped REST APIs consumed by 40k developers",
    ], "TypeScript, Node, PostgreSQL"),
    exp("e4", "Devbox", "Software Engineer", "2016–2018", [
      "Maintained CI infrastructure",
      "Implemented caching layer cutting page loads 60%",
    ], "Python, Redis"),
  ],
  education: [edu("ed1", "Tech Institute", "BS", "Computer Science", "2016")],
  skills: [
    skill("Go", "Languages"), skill("TypeScript", "Languages"), skill("Python", "Languages"),
    skill("Kafka", "Databases"), skill("PostgreSQL", "Databases"), skill("Redis", "Databases"),
    skill("Kubernetes", "Cloud"), skill("AWS", "Cloud"), skill("GCP", "Cloud"),
    skill("Terraform", "DevOps"), skill("CI/CD", "DevOps"), skill("Docker", "DevOps"),
    skill("gRPC", "Frameworks"), skill("Node", "Frameworks"), skill("React", "Frameworks"),
    skill("Distributed Systems", "Architecture"), skill("System Design", "Architecture"),
    skill("Observability", "Architecture"), skill("Tracing", "Architecture"),
    skill("Load Testing", "Tools"), skill("Grafana", "Tools"),
    skill("Mentoring", "Leadership"), skill("Tech Talks", "Leadership"),
    skill("Incident Response", "Leadership"), skill("Postgres Optimization", "Databases"),
    skill("Stream Processing", "Architecture"), skill("Event Sourcing", "Architecture"),
    skill("Microservices", "Architecture"), skill("REST", "Frameworks"),
    skill("GraphQL", "Frameworks"), skill("Rust", "Languages"),
    skill("Kubernetes Operators", "Cloud"),
  ],
  projects: [
    { id: "p1", name: "Flowrate", description: "Open-source stream replay tool", tech: "Rust", link: "github.com/example/flowrate", startDate: "", endDate: "", role: "Author", teamSize: "1", status: "Ongoing", bulletPoints: ["1.2k GitHub stars"] },
    { id: "p2", name: "Kube Lens", description: "Cluster visualization dashboard", tech: "TypeScript, React", link: "", startDate: "", endDate: "", role: "Creator", teamSize: "2", status: "Completed", bulletPoints: [] },
    { id: "p3", name: "Ledgerd", description: "Double-entry ledger service", tech: "Go, PostgreSQL", link: "", startDate: "", endDate: "", role: "Architect", teamSize: "4", status: "Completed", bulletPoints: [] },
    { id: "p4", name: "Tracewalk", description: "Distributed trace diffing CLI", tech: "Python", link: "", startDate: "", endDate: "", role: "Author", teamSize: "1", status: "Completed", bulletPoints: [] },
    { id: "p5", name: "Edge Cache Lab", description: "CDN caching experiments", tech: "Go", link: "", startDate: "", endDate: "", role: "Author", teamSize: "1", status: "Ongoing", bulletPoints: [] },
  ],
  certifications: [
    { id: "c1", name: "CKA", issuer: "CNCF", date: "2023", link: "", description: "", expiryDate: "2026", skills: "Kubernetes" },
    { id: "c2", name: "AWS Solutions Architect", issuer: "AWS", date: "2021", link: "", description: "", expiryDate: "2024", skills: "AWS" },
  ],
  achievements: [
    { id: "a1", title: "Patent", description: "Adaptive backpressure method", date: "2023", issuer: "USPTO" },
  ],
});

/** Executive: long career, leadership-heavy. */
export const EXECUTIVE: Resume = makeResume({
  name: "Catherine Wells",
  title: "Chief Operating Officer",
  email: "catherine@example.com",
  phone: "+1 555 0144",
  summary:
    "COO with 18 years scaling operations, people and P&L across three venture-backed companies.",
  experience: Array.from({ length: 9 }, (_, i) =>
    exp(
      `e${i + 1}`,
      `Group ${i + 1}`,
      i === 0 ? "Chief Operating Officer" : i < 3 ? "VP, Operations" : i < 5 ? "Director of Operations" : "Operations Manager",
      `${2025 - i * 2}–Present`,
      [
        "Owned a $40M operating budget across 4 departments",
        "Scaled the organization from 50 to 400 employees",
        "Negotiated vendor contracts saving $6M annually",
        "Built the operations analytics function from zero",
        "Led company-wide process transformation program",
        "Board reporting and investor updates",
        "Established OKR system across business units",
      ],
    ),
  ),
  education: [edu("ed1", "State University", "MBA", "Strategy", "2009"), edu("ed2", "State University", "BSc", "Economics", "2005")],
  skills: [
    skill("P&L Management", "Leadership"),
    skill("Scaling Teams", "Leadership"),
    skill("Board Relations", "Leadership"),
    skill("M&A", "Strategy"),
    skill("OKRs", "Strategy"),
  ],
  achievements: [
    { id: "a1", title: "Operator of the Year", description: "National operations award", date: "2022", issuer: "Ops Council" },
    { id: "a2", title: "Exit", description: "Led operations through a $210M acquisition", date: "2021", issuer: "Company" },
  ],
  interests: [{ id: "i1", name: "Sailing" }],
});

/** Sparse: minimal content — one short role, few skills, empty extras. */
export const SPARSE: Resume = makeResume({
  name: "Tom Becker",
  title: "Support Specialist",
  email: "tom.becker@example.com",
  phone: "+1 555 0100",
  address: "Lisbon, Portugal",
  summary: "Support specialist moving toward software. Customer-facing background with early scripting experience.",
  careerStage: "recent-graduate",
  experience: [
    exp(
      "x1",
      "Bright Apps",
      "Customer Support Specialist",
      "2023–Present",
      [
        "Resolved 40+ tier-1 tickets daily across billing and integrations.",
        "Wrote internal help articles that cut repeat contacts on top 5 issues.",
      ],
      "Zendesk, SQL",
    ),
  ],
  education: [edu("ed1", "University of Lisbon", "BSc", "Communication", "2022")],
  skills: [
    skill("SQL", "Databases"),
    skill("Python", "Languages"),
    skill("Zendesk", "Tools"),
    skill("Excel", "Tools"),
    skill("Spanish", "Languages"),
  ],
});
export const PROFILES = {
  sparse: SPARSE,
  early: EARLY_CAREER,
  mid: MID_CAREER,
  senior: SENIOR,
  technical: TECHNICAL,
  executive: EXECUTIVE,
} as const;

/* ── §26 job-type fixtures ────────────────────────────────────────────── */

export interface JobFixture {
  title: string;
  company: string;
  text: string;
}

export const JOBS: JobFixture[] = [
  {
    title: "Software Engineer",
    company: "Acme Cloud",
    text: "We are looking for a Software Engineer with strong Python and Go experience building distributed systems. You will design REST APIs, work with PostgreSQL and Kafka, and own services in AWS. Experience with Kubernetes and CI/CD is preferred. Requirements: 4+ years backend development, excellent communication skills.",
  },
  {
    title: "Senior Product Manager",
    company: "Northwind",
    text: "Northwind seeks a Senior Product Manager to own roadmapping for our B2B platform. You will run discovery, define requirements, partner with engineering, and use A/B testing and analytics to drive activation. Requirements: 5+ years product management, SaaS experience, strong stakeholder management.",
  },
  {
    title: "Data Analyst",
    company: "Brightpath",
    text: "Brightpath is hiring a Data Analyst. You will write SQL queries, build Tableau dashboards, and present findings to business stakeholders. Requirements: 2+ years analytics experience, advanced Excel, data visualization portfolio is a plus.",
  },
  {
    title: "Marketing Manager",
    company: "Lumen Goods",
    text: "Lumen Goods seeks a Marketing Manager to own brand campaigns, content strategy, and lifecycle email. You will manage budget, agency partners, and report on pipeline influence. Requirements: 5+ years marketing, excellent copywriting, B2C brand experience preferred.",
  },
  {
    title: "Product Designer",
    company: "Fable",
    text: "Fable is looking for a Product Designer to craft end-to-end experiences in Figma, run usability studies, and ship UI with engineering. Requirements: 4+ years product design, strong portfolio, design systems experience.",
  },
  {
    title: "Account Executive",
    company: "Vantage",
    text: "Vantage is hiring an Account Executive to run full-cycle B2B sales: prospecting, demos, negotiation and closing. Requirements: 3+ years quota-carrying sales, CRM experience (Salesforce), excellent presentation skills.",
  },
  {
    title: "Financial Analyst",
    company: "Meridian Capital",
    text: "Meridian Capital seeks a Financial Analyst for modeling, forecasting and variance analysis. You will prepare board decks and support FP&A. Requirements: 3+ years finance, advanced Excel, CFA progress a plus.",
  },
  {
    title: "Operations Manager",
    company: "Rapid Logistics",
    text: "Rapid Logistics is hiring an Operations Manager to own warehouse processes, vendor management and continuous improvement. Requirements: 4+ years operations, KPI ownership, lean experience preferred.",
  },
  {
    title: "Chief Operating Officer",
    company: "Series C Scale-up",
    text: "Our scale-up is seeking a Chief Operating Officer to own P&L, scale the organization, lead board reporting, and drive M&A integration. Requirements: 15+ years leadership, experience scaling teams 100→500, board-level communication.",
  },
];

/* ── A hand-built deterministic match for SWE-style jobs ─────────────── */

/**
 * Four classifications (PROVEN / RELATED / COMMUNICATION_GAP / MISSING)
 * with honest evidence refs — used to test job-aware emphasis end to end.
 */
export function makeMatchFixture(
  items: Array<{
    sourceGroup?: QualificationMatch["items"][number]["sourceGroup"];
    classification: QualificationMatch["items"][number]["classification"];
    requirement: string;
    evidence?: QualificationMatch["items"][number]["evidence"];
  }>,
): QualificationMatch {
  const now = new Date().toISOString();
  const mapped = items.map((it, i) => ({
    id: `qm-${i}`,
    sourceGroup: it.sourceGroup ?? "skill",
    classification: it.classification,
    requirement: it.requirement,
    jobSource: { sourceRef: `jd:skill:${i}`, sourceText: it.requirement, method: "fixture" },
    reason: "fixture",
    evidence: it.evidence ?? [],
  }));
  return {
    id: "fixture-match",
    version: 1,
    createdAt: now,
    updatedAt: now,
    careerProfileId: "cp-fixture",
    jobProfileId: "jp-fixture",
    items: mapped,
    summary: {
      total: mapped.length,
      proven: mapped.filter((m) => m.classification === "PROVEN").length,
      related: mapped.filter((m) => m.classification === "RELATED").length,
      communicationGap: mapped.filter((m) => m.classification === "COMMUNICATION_GAP").length,
      missing: mapped.filter((m) => m.classification === "MISSING").length,
    },
  };
}

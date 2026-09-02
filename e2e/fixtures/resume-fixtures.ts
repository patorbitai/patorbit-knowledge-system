/**
 * Deterministic resume fixtures for browser pagination testing.
 *
 * Each fixture is designed to exercise a specific pagination boundary condition.
 * The data is intentionally sized so that content crosses page boundaries at
 * predictable points when rendered through the canonical A4 page frame.
 */
import type { Resume } from "../../src/types/resume";

// Helper to create a resume with minimal required fields for testing
// (test fixtures don't need every optional field)
function makeResume(data: Record<string, unknown>): Resume {
  return data as unknown as Resume;
}

// ── Fixture A: Small one-page resume ────────────────────────────────────────
// All content should fit comfortably on a single A4 page.

export const SMALL_RESUME = makeResume({
  name: "Alex Thompson",
  title: "Software Engineer",
  email: "alex@example.com",
  phone: "+1 (555) 0100",
  address: "Seattle, WA",
  summary: "Software engineer with 3 years of experience building web applications.",
  social: { linkedin: "linkedin.com/in/alex", github: "github.com/alex", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [
    {
      id: "s-1",
      company: "TechCo",
      position: "Software Engineer",
      location: "Seattle, WA",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "2022-01",
      endDate: "",
      current: true,
      duration: "2022 – Present",
      description: "Built and maintained web applications.",
      achievements: "",
      techUsed: "React, TypeScript, Node.js",
      bulletPoints: [
        "Developed a customer dashboard used by 500+ users",
        "Improved API response times by 40%",
      ],
    },
  ],
  education: [
    {
      id: "se-1",
      school: "University of Washington",
      degree: "B.S.",
      field: "Computer Science",
      year: "2021",
      gpa: "3.7",
      minor: "",
      honors: "",
      activities: "",
      location: "Seattle, WA",
    },
  ],
  skills: [
    { id: "ss-1", name: "React", level: "Advanced", category: "Frontend", years: "3" },
    { id: "ss-2", name: "TypeScript", level: "Advanced", category: "Languages", years: "3" },
    { id: "ss-3", name: "Node.js", level: "Intermediate", category: "Backend", years: "2" },
  ],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [{ id: "sl-1", name: "English", proficiency: "Native" }],
  interests: [],
  references: [],
  portfolio: [],
  templateId: "modern-clean",
  careerStage: "working_professional",
  claims: [],
});

// ── Fixture B: Multi-page resume ────────────────────────────────────────────
// Enough content to require 2+ pages with the Corporate Blue template.

export const MULTIPAGE_RESUME = makeResume({
  name: "Jordan Rivera",
  title: "Senior Platform Engineer",
  email: "jordan@example.com",
  phone: "+1 (415) 555-0184",
  address: "San Francisco, CA",
  summary:
    "Platform and infrastructure engineer with 10 years of experience designing cloud-native systems that serve millions of users. Specializes in Kubernetes, developer experience, and reliability engineering. Led migrations that cut infrastructure cost by 38% and reduced mean time to recovery from hours to minutes. Passionate about building tools that make engineers more productive.",
  social: {
    linkedin: "linkedin.com/in/jordanrivera",
    github: "github.com/jordanrivera",
  },
  experience: [
    {
      id: "mp-1",
      company: "Northwind Labs",
      position: "Staff Platform Engineer",
      location: "San Francisco, CA",
      employmentType: "Full-time",
      startDate: "2021-06",
      endDate: "",
      current: true,
      duration: "2021 – Present",
      description:
        "Lead the internal developer platform serving 400+ engineers across 60 product teams. Own the Kubernetes control plane, CI/CD foundations, and golden-path observability.",
      achievements: "",
      techUsed: "Kubernetes, Terraform, Go, AWS",
      bulletPoints: [
        "Designed a multi-tenant Kubernetes platform now running 1,200+ workloads in production",
        "Introduced GitOps delivery with Argo CD, cutting deploy time from 25 minutes to under 4",
        "Built an internal CLI adopted by 300+ engineers that reduced environment setup to one command",
        "Grew the platform team from 2 to 9 engineers and established an on-call rotation",
      ],
    },
    {
      id: "mp-2",
      company: "Meridian Systems",
      position: "Senior Software Engineer",
      location: "Seattle, WA",
      employmentType: "Full-time",
      startDate: "2017-03",
      endDate: "2021-05",
      current: false,
      duration: "2017 – 2021",
      description:
        "Backend engineer on the payments platform processing $2B annually. Owned service decomposition, database sharding, and the incident response runbooks.",
      achievements: "",
      techUsed: "Go, PostgreSQL, Kafka, AWS",
      bulletPoints: [
        "Led migration from a monolith to 14 microservices without a single customer-facing incident",
        "Sharded the core PostgreSQL database to support 10× transaction volume",
        "Cut p95 checkout latency from 900 ms to 210 ms through caching and query optimization",
      ],
    },
    {
      id: "mp-3",
      company: "Brightpath Analytics",
      position: "Software Engineer",
      location: "Portland, OR",
      employmentType: "Full-time",
      startDate: "2014-06",
      endDate: "2017-02",
      current: false,
      duration: "2014 – 2017",
      description:
        "Full-stack engineer on the data pipeline team, building ingestion and real-time dashboards for enterprise customers.",
      achievements: "",
      techUsed: "Python, React, Spark",
      bulletPoints: [
        "Rebuilt the ingestion pipeline in Spark, doubling throughput and cutting costs by 45%",
        "Shipped the company's first real-time analytics dashboard, adopted by 120+ customers",
      ],
    },
    {
      id: "mp-4",
      company: "CloudNine",
      position: "Software Engineer Intern",
      location: "Austin, TX",
      employmentType: "Internship",
      startDate: "2013-05",
      endDate: "2013-08",
      current: false,
      duration: "Summer 2013",
      description: "Intern on the compute team.",
      achievements: "",
      techUsed: "Python, Linux, AWS",
      bulletPoints: [
        "Automated stale-instance cleanup, recovering 12% of idle capacity",
      ],
    },
  ],
  education: [
    {
      id: "me-1",
      school: "Carnegie Mellon University",
      degree: "M.S.",
      field: "Computer Science",
      year: "2016",
      gpa: "3.9",
    },
    {
      id: "me-2",
      school: "University of Texas at Austin",
      degree: "B.S.",
      field: "Computer Engineering",
      year: "2014",
      gpa: "3.8",
    },
  ],
  skills: [
    { id: "ms-1", name: "Kubernetes", level: "Expert", category: "Infrastructure" },
    { id: "ms-2", name: "Go", level: "Expert", category: "Languages" },
    { id: "ms-3", name: "TypeScript", level: "Expert", category: "Languages" },
    { id: "ms-4", name: "AWS", level: "Expert", category: "Cloud" },
    { id: "ms-5", name: "Terraform", level: "Advanced", category: "Infrastructure" },
    { id: "ms-6", name: "PostgreSQL", level: "Advanced", category: "Databases" },
    { id: "ms-7", name: "Docker", level: "Expert", category: "Infrastructure" },
    { id: "ms-8", name: "Argo CD", level: "Advanced", category: "CI/CD" },
    { id: "ms-9", name: "Kafka", level: "Advanced", category: "Data" },
    { id: "ms-10", name: "React", level: "Advanced", category: "Frontend" },
  ],
  projects: [
    {
      id: "mp-p1",
      name: "Helmless",
      description:
        "Open-source Kubernetes manifest generation tool that removes Helm templating complexity for teams adopting GitOps.",
      tech: "Go, Kubernetes, YAML",
      link: "github.com/jordan/helmless",
      startDate: "2022-01",
      endDate: "2023-04",
      role: "Creator",
      bulletPoints: ["4,100 GitHub stars; adopted by 40+ organizations"],
    },
    {
      id: "mp-p2",
      name: "Platform Observability Console",
      description:
        "Unified internal console aggregating metrics, traces, and deploy state.",
      tech: "React, Go, Datadog",
      link: "",
      startDate: "2022-03",
      endDate: "2023-02",
      role: "Tech Lead",
      bulletPoints: ["Reduced troubleshooting time from 38 minutes to 9 minutes"],
    },
    {
      id: "mp-p3",
      name: "Event Bus Migration",
      description: "Company-wide migration from self-managed queue to managed Kafka.",
      tech: "Kafka, Go, AWS MSK",
      link: "",
      startDate: "2020-01",
      endDate: "2020-11",
      role: "Lead Engineer",
      bulletPoints: ["Zero-downtime migration across 22 services"],
    },
  ],
  certifications: [
    {
      id: "mc-1",
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023-03",
    },
    {
      id: "mc-2",
      name: "Certified Kubernetes Administrator (CKA)",
      issuer: "CNCF",
      date: "2022-08",
    },
    {
      id: "mc-3",
      name: "HashiCorp Certified: Terraform Associate",
      issuer: "HashiCorp",
      date: "2021-11",
    },
    {
      id: "mc-4",
      name: "Google Cloud Professional Cloud Architect",
      issuer: "Google Cloud",
      date: "2021-05",
    },
  ],
  achievements: [
    { id: "ma-1", title: "Infrastructure Innovation Award", description: "Company-wide award.", date: "2023", issuer: "Northwind Labs" },
    { id: "ma-2", title: "Speaker, KubeCon NA", description: "GitOps at scale talk.", date: "2022", issuer: "CNCF" },
  ],
  languages: [
    { id: "ml-1", name: "English", proficiency: "Native" },
    { id: "ml-2", name: "Spanish", proficiency: "Professional" },
  ],
  interests: [],
  references: [],
  portfolio: [],
  templateId: "corporate-blue",
  careerStage: "working_professional",
  claims: [],
});

// ── Fixture C: Experience boundary case ─────────────────────────────────────
// Positioned so Experience 3 barely doesn't fit at the bottom of page 1.
// This is the critical regression test for atomic item pagination.

export const EXPERIENCE_BOUNDARY_RESUME = makeResume({
  name: "Priya Sharma",
  title: "Data Engineer",
  email: "priya@example.com",
  phone: "+1 (555) 0200",
  address: "New York, NY",
  summary:
    "Data engineer with 6 years of experience building scalable data pipelines. Expertise in PySpark, Azure Data Factory, and cloud-based data warehousing. Passionate about data quality and operational excellence.",
  social: { linkedin: "linkedin.com/in/priyasharma" },
  experience: [
    {
      id: "eb-1",
      company: "DataCorp Inc.",
      position: "Senior Data Engineer",
      location: "New York, NY",
      employmentType: "Full-time",
      startDate: "2022-01",
      endDate: "",
      current: true,
      duration: "2022 – Present",
      description: "Lead data engineer on the analytics platform team.",
      achievements: "",
      techUsed: "PySpark, Azure, SQL",
      bulletPoints: [
        "Designed and implemented a real-time data pipeline processing 2M events/day",
        "Reduced data latency from 4 hours to 15 minutes using streaming architecture",
        "Built automated data quality framework that catches 95% of anomalies before downstream consumption",
        "Led migration from on-premises Hadoop cluster to Azure Synapse Analytics",
      ],
    },
    {
      id: "eb-2",
      company: "Analytics Solutions Ltd.",
      position: "Data Engineer",
      location: "Chicago, IL",
      employmentType: "Full-time",
      startDate: "2019-06",
      endDate: "2021-12",
      current: false,
      duration: "2019 – 2021",
      description: "Built ETL pipelines for enterprise data warehouse.",
      achievements: "",
      techUsed: "Python, Airflow, Snowflake",
      bulletPoints: [
        "Developed 50+ Airflow DAGs orchestrating daily ETL across 20+ data sources",
        "Implemented incremental loading patterns that reduced processing costs by 35%",
        "Created a self-service data catalog adopted by 80+ analysts",
      ],
    },
    {
      id: "eb-3",
      company: "TechStart Analytics",
      position: "Junior Data Engineer",
      location: "Austin, TX",
      employmentType: "Full-time",
      startDate: "2017-08",
      endDate: "2019-05",
      current: false,
      duration: "2017 – 2019",
      description: "Junior data engineer building data pipelines and dashboards.",
      achievements: "",
      techUsed: "Python, SQL, Tableau",
      bulletPoints: [
        "Built automated reporting pipeline that eliminated 20 hours/week of manual work",
        "Developed Python scripts for data validation and anomaly detection across 15 source systems",
        "Created Tableau dashboards used by C-suite for weekly business reviews",
        "Wrote comprehensive documentation for all data pipelines, reducing onboarding time by 50%",
        "Participated in on-call rotation for data pipeline monitoring and incident response",
        "Collaborated with data science team to prepare training datasets for ML models",
      ],
    },
    {
      id: "eb-4",
      company: "DataFlow Systems",
      position: "Data Analyst Intern",
      location: "San Francisco, CA",
      employmentType: "Internship",
      startDate: "2017-01",
      endDate: "2017-05",
      current: false,
      duration: "Spring 2017",
      description: "Data analyst intern working on reporting automation.",
      achievements: "",
      techUsed: "SQL, Excel, Python",
      bulletPoints: [
        "Automated weekly sales reports, saving 10 hours/week of manual compilation",
      ],
    },
  ],
  education: [
    {
      id: "ee-1",
      school: "Columbia University",
      degree: "M.S.",
      field: "Data Science",
      year: "2017",
      gpa: "3.8",
    },
    {
      id: "ee-2",
      school: "University of Texas at Austin",
      degree: "B.S.",
      field: "Statistics",
      year: "2015",
      gpa: "3.6",
    },
  ],
  skills: [
    { id: "es-1", name: "PySpark", level: "Expert", category: "Data Processing" },
    { id: "es-2", name: "Azure Data Factory", level: "Expert", category: "Cloud" },
    { id: "es-3", name: "SQL", level: "Expert", category: "Languages" },
    { id: "es-4", name: "Python", level: "Advanced", category: "Languages" },
    { id: "es-5", name: "Airflow", level: "Advanced", category: "Orchestration" },
    { id: "es-6", name: "Snowflake", level: "Advanced", category: "Databases" },
    { id: "es-7", name: "dbt", level: "Intermediate", category: "Data Transformation" },
    { id: "es-8", name: "Terraform", level: "Intermediate", category: "IaC" },
  ],
  projects: [
    {
      id: "ep-1",
      name: "Real-time Fraud Detection Pipeline",
      description: "Streaming pipeline for real-time fraud detection.",
      tech: "Kafka, PySpark, Redis",
      link: "",
      startDate: "2023-01",
      endDate: "",
      role: "Lead Engineer",
      bulletPoints: ["Processed 500K events/second with <100ms latency"],
    },
  ],
  certifications: [
    {
      id: "ec-1",
      name: "Azure Data Engineer Associate",
      issuer: "Microsoft",
      date: "2022-06",
    },
  ],
  achievements: [],
  languages: [{ id: "el-1", name: "English", proficiency: "Native" }],
  interests: [],
  references: [],
  portfolio: [],
  templateId: "corporate-blue",
  careerStage: "working_professional",
  claims: [],
});

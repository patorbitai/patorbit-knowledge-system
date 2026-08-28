import { describe, it, expect } from "vitest";
import { rawToResume } from "../resume-parser";

describe("Multi-format import compatibility", () => {
  // Format 1: Pipe-separated experience (very common)
  it("Format 1: Pipe-separated company | position", () => {
    const text = `Rahul Sharma
Senior Data Engineer

EXPERIENCE
Data Engineer | TechCorp India Pvt Ltd | Jan 2022 – Present
• Built real-time data pipelines using Apache Kafka and Spark
• Designed data warehouse schema for analytics team

ML Engineer | StartupXYZ | Jun 2020 – Dec 2021
• Developed recommendation engine using Python and TensorFlow
• Deployed models on AWS SageMaker

EDUCATION
B.Tech Computer Science | IIT Bombay | 2016-2020

SKILLS
Python, Apache Spark, Kafka, SQL, AWS, Docker, Kubernetes`;

    const resume = rawToResume(text);
    console.log("Format 1 (pipe-separated):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  ${e.company} | ${e.position} | ${e.duration}`));

    expect(resume.experience?.length).toBe(2);
    expect(resume.experience?.[0].company).toContain("TechCorp");
    expect(resume.experience?.[0].position).toContain("Data Engineer");
    expect(resume.skills?.length).toBeGreaterThanOrEqual(5);
  });

  // Format 2: Tab-separated / dash-separated
  it("Format 2: Dash-separated company – position", () => {
    const text = `John Developer
Full Stack Developer

WORK EXPERIENCE
Google – Senior Software Engineer
Mountain View, CA
March 2019 – Present
- Led development of microservices architecture
- Reduced API latency by 40%

Microsoft – Software Engineer
Redmond, WA
June 2016 – February 2019
- Built Azure DevOps integrations
- Mentored junior developers

EDUCATION
Stanford University
M.S. Computer Science, 2016

TECHNICAL SKILLS
JavaScript, TypeScript, React, Node.js, Python, Go, gRPC`;

    const resume = rawToResume(text);
    console.log("Format 2 (dash-separated):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  ${e.company} | ${e.position} | ${e.duration}`));

    expect(resume.experience?.length).toBe(2);
    expect(resume.experience?.[0].company).toContain("Google");
    expect(resume.experience?.[0].position).toContain("Senior Software Engineer");
  });

  // Format 3: Position-first with company on next line
  it("Format 3: Position first, company on next line", () => {
    const text = `Priya Patel
Data Scientist

WORK HISTORY
Machine Learning Engineer
PystackJs Pvt. Ltd. (MarsDevs)
2022 – Present
Worked on Python-based machine-learning pipelines

Data Analyst
Infosys Limited
Jan 2020 – Dec 2021
Built dashboards for executive reporting

ACADEMIC QUALIFICATION
Bachelor of Engineering in Computer Science
Savitribai Phule Pune University
2016 – 2020

TECHNICAL COMPETENCIES
Python, R, SQL, TensorFlow, PyTorch, Tableau, Power BI`;

    const resume = rawToResume(text);
    console.log("Format 3 (position-first):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  ${e.company} | ${e.position} | ${e.duration}`));

    expect(resume.experience?.length).toBe(2);
    // Position-first: company should NOT contain the position title
    expect(resume.experience?.[0].company).not.toContain("Machine Learning");
    expect(resume.experience?.[0].position).toContain("Machine Learning");
  });

  // Format 4: Tab-separated with explicit labels
  it("Format 4: Label-based format (Company: X, Role: Y)", () => {
    const text = `Amit Kumar
Backend Developer

EXPERIENCE

Company: Amazon
Role: SDE II
Duration: Apr 2021 – Present
Location: Bangalore, India
Description: Designed and maintained payment microservices

Company: Flipkart
Role: SDE I
Duration: Jul 2019 – Mar 2021
Location: Bangalore, India
Description: Built order management system

EDUCATION

Institute: NIT Trichy
Degree: B.Tech in IT
Year: 2015 – 2019

SKILLS
Java, Spring Boot, Microservices, Redis, RabbitMQ, AWS, MySQL`;

    const resume = rawToResume(text);
    console.log("Format 4 (label-based):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  ${e.company} | ${e.position} | ${e.duration}`));

    expect(resume.experience?.length).toBe(2);
    expect(resume.experience?.[0].company).toContain("Amazon");
    expect(resume.experience?.[0].position).toContain("SDE");
  });

  // Format 5: Comma-separated skills with levels
  it("Format 5: Skills with levels (Skill – Level)", () => {
    const text = `Sarah Chen
DevOps Engineer

EXPERIENCE
DevOps Engineer at CloudScale Inc
2021 – Present
- Managed Kubernetes clusters serving 10M+ requests/day

EDUCATION
University of Washington
B.S. Computer Engineering, 2021

CORE COMPETENCIES
Docker – Advanced
Kubernetes – Expert
Terraform – Advanced
AWS – Advanced
Python – Intermediate
Linux – Expert
CI/CD – Advanced
Monitoring (Prometheus/Grafana) – Intermediate`;

    const resume = rawToResume(text);
    console.log("Format 5 (skills with levels):");
    console.log("  Skills count:", resume.skills?.length);
    resume.skills?.forEach(s => console.log(`  ${s.name} (${s.level || 'no level'})`));

    expect(resume.skills?.length).toBeGreaterThanOrEqual(5);
    expect(resume.skills?.some(s => s.name.includes("Docker"))).toBe(true);
  });

  // Format 6: Multi-column resume (company and date on same line)
  it("Format 6: Company date-rail format", () => {
    const text = `Alex Johnson
Product Manager

EXPERIENCE
Senior Product Manager
Meta (Facebook)                2021 – Present
Led product strategy for Instagram Reels creator tools

Product Manager
Spotify                         2019 – 2021
Managed podcast discovery features for 400M users

Associate Product Manager
Dropbox                         2017 – 2019
Launched Dropbox Paper collaboration features

EDUCATION
MBA, Harvard Business School, 2017
B.A. Economics, Yale University, 2015

SKILLS
Product Strategy, User Research, A/B Testing, SQL, Figma, Jira`;

    const resume = rawToResume(text);
    console.log("Format 6 (date-rail):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  ${e.company} | ${e.position} | ${e.duration}`));

    expect(resume.experience?.length).toBe(3);
    expect(resume.experience?.[0].company).toContain("Meta");
  });

  // Format 7: Simple one-line bullets without bullet markers
  it("Format 7: Unmarked bullet lines (no • or -)", () => {
    const text = `Nina Torres
Marketing Manager

EXPERIENCE
Marketing Manager
ABC Marketing Agency
2020-Present
Developed comprehensive digital marketing strategies
Increased organic traffic by 200% through SEO optimization
Managed a team of 8 content creators and designers
Launched 15+ successful social media campaigns

Content Specialist
XYZ Media Corp
2018-2020
Created and edited blog content for B2B clients
Conducted keyword research and competitive analysis

EDUCATION
B.A. Communications, NYU, 2018

SKILLS
SEO, Google Analytics, HubSpot, Content Strategy, Social Media Marketing`;

    const resume = rawToResume(text);
    console.log("Format 7 (unmarked bullets):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  Desc lines: ${e.description?.split('\\n').length}`));

    expect(resume.experience?.length).toBe(2);
    // All 4 description lines should be captured
    const desc = resume.experience?.[0].description || "";
    expect(desc).toContain("digital marketing");
    expect(desc).toContain("organic traffic");
    expect(desc).toContain("team of 8");
    expect(desc).toContain("social media");
  });

  // Format 8: Tab-indented sections (common in Word exports)
  it("Format 8: Bold headers with no standard names", () => {
    const text = `David Lee
Cloud Architect

PROFESSIONAL BACKGROUND
Amazon Web Services – Solutions Architect
2020 – Present
Architected multi-region disaster recovery solutions

Rackspace – Cloud Engineer
2017 – 2020
Migrated 200+ workloads to public cloud

EDUCATIONAL BACKGROUND
Georgia Tech
M.S. Computer Science, 2017

TECHNOLOGIES
AWS, Azure, GCP, Terraform, Ansible, Python, CloudFormation`;

    const resume = rawToResume(text);
    console.log("Format 8 (non-standard headers):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  ${e.company} | ${e.position} | ${e.duration}`));

    expect(resume.experience?.length).toBe(2);
  });

  // Format 9: Date in parentheses
  it("Format 9: Date in parentheses (2020-2023)", () => {
    const text = `Maria Garcia
UX Designer

EXPERIENCE
UX Designer (2021-present)
Airbnb, San Francisco
Redesigned the checkout flow increasing conversion by 15%

UI/UX Developer (2019-2021)
Shopify, Ottawa
Built design system used across 12 product teams

EDUCATION
Rhode Island School of Design
BFA Graphic Design, 2019

SKILLS
Figma, Sketch, Adobe XD, HTML/CSS, React, User Testing`;

    const resume = rawToResume(text);
    console.log("Format 9 (date in parens):");
    console.log("  Experience count:", resume.experience?.length);
    resume.experience?.forEach(e => console.log(`  ${e.company} | ${e.position} | ${e.duration}`));

    expect(resume.experience?.length).toBe(2);
  });
});

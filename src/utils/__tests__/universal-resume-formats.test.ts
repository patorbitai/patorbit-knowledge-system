import { describe, it, expect } from "vitest";
import { parseRawResumeText } from "../resume-parser";

/**
 * Universal resume format test suite.
 * Tests the most common resume formats found in the wild.
 * If ALL these pass, the parser handles real-world resumes reliably.
 */

describe("Universal Resume Format Compatibility", () => {
  // ─── FORMAT 1: Standard US resume ───
  it("Format 1: Standard US resume with section headers", () => {
    const text = `JOHN SMITH
Software Engineer
john@email.com | (555) 123-4567 | San Francisco, CA

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of experience.

WORK EXPERIENCE
Senior Software Engineer
Google | Mountain View, CA | Jan 2020 – Present
• Led development of microservices architecture
• Reduced API latency by 40%

Software Engineer
Meta | Menlo Park, CA | Jun 2017 – Dec 2019
• Built real-time data pipelines
• Mentored junior engineers

EDUCATION
Stanford University
Master of Science in Computer Science | 2015 – 2017

SKILLS
JavaScript, TypeScript, Python, React, Node.js, AWS, Docker

PROJECTS
Open Source CLI Tool
Built a command-line tool for data processing. Tech: Python, Click`;

    const parsed = parseRawResumeText(text);
    expect(parsed.name).toBe("JOHN SMITH");
    expect(parsed.email).toBe("john@email.com");
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(5);
  });

  // ─── FORMAT 2: Spaced-out PDF headers (like Arvind's) ───
  it("Format 2: Spaced-out PDF headers", () => {
    const text = `ARVIND CHAUHAN
Data Engineer

EX P E R I E N C E
PystackJs Pvt. Ltd. (MarsDevs) Jan 2024 – Apr 2024
Machine Learning Engineer
• Worked on Python-based machine-learning workflows

People Tech Group Apr 2022 – Jan 2024
Data Engineer
• Developed Azure Data Factory pipelines

ED U C A T I O N
Bharathiar University 2016–2018
Master of Business Administration (MBA)

SK I L L S
Python, SQL, Azure Data Factory, PySpark`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
  });

  // ─── FORMAT 3: Bullet separator format ───
  it("Format 3: Company • Date • Location format", () => {
    const text = `SARAH JONES
Product Manager

WORK EXPERIENCE

Senior PM • Google • Jan 2021 – Present • New York, NY
• Led product strategy for enterprise dashboard
• Increased user engagement by 35%

Product Manager • Microsoft • Mar 2018 – Dec 2020 • Seattle, WA
• Launched 3 major product features
• Managed cross-functional team of 15

EDUCATION

MBA • Harvard Business School • 2016–2018
BS Computer Science • MIT • 2012–2016

SKILLS
Product Strategy, Agile, SQL, Python, Figma`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
  });

  // ─── FORMAT 4: Label-based format ───
  it("Format 4: Label-based format (Company: X, Role: Y)", () => {
    const text = `MIKE CHEN
DevOps Engineer
mike@company.com

WORK EXPERIENCE

Company: Amazon Web Services
Role: Senior DevOps Engineer
Duration: March 2020 – Present
Location: Seattle, WA
Description: Led cloud infrastructure team

Company: Netflix
Role: DevOps Engineer
Duration: January 2018 – February 2020
Location: Los Gatos, CA
Description: Managed Kubernetes clusters

EDUCATION

Institute: Carnegie Mellon University
Degree: BS Computer Science
Year: 2014 – 2018

SKILLS
AWS, Azure, Kubernetes, Docker, Terraform, CI/CD`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
  });

  // ─── FORMAT 5: Position-first with comma company ───
  it("Format 5: Position, Company format", () => {
    const text = `LISA WANG
Data Analyst

EXPERIENCE

Senior Data Analyst, Spotify | 2021 – Present | New York, NY
• Built dashboards for streaming analytics
• Automated reporting pipelines

Data Analyst, Uber | 2019 – 2021 | San Francisco, CA
• Analyzed rider behavior patterns
• Created A/B testing frameworks

EDUCATION

Master of Science in Data Science, Columbia University | 2017 – 2019
Bachelor of Statistics, UC Berkeley | 2013 – 2017

SKILLS
Python, R, SQL, Tableau, Machine Learning`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
  });

  // ─── FORMAT 6: Single-column with pipe separators ───
  it("Format 6: Pipe-separated company | position | date", () => {
    const text = `DAVID KIM
Backend Engineer

EXPERIENCE

Stripe | Senior Backend Engineer | 2020 – Present
• Designed payment processing system
• Handled 10M+ daily transactions

Square | Backend Engineer | 2018 – 2020
• Built merchant analytics platform
• Implemented fraud detection algorithms

EDUCATION

University of California Berkeley | Bachelor of Science in Computer Science | 2014 – 2018

SKILLS
Go, Python, PostgreSQL, Redis, Kafka, gRPC`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
  });

  // ─── FORMAT 7: Multi-column PDF extraction ───
  it("Format 7: PDF with multi-line bullet descriptions", () => {
    const text = `ANNA BROWN
Cloud Architect

WORK EXPERIENCE

Principal Cloud Architect
Amazon Web Services (AWS) | Jan 2019 – Present | Seattle, WA
• Designed and implemented enterprise-scale cloud migration strategy for Fortune 500 clients, resulting in 60% cost reduction and improved system reliability
• Led a team of 12 cloud engineers to deliver multi-region, highly available infrastructure supporting 99.99% uptime SLA
• Developed automated deployment pipelines using Terraform and CloudFormation, reducing deployment time from 2 hours to 15 minutes

Cloud Solutions Engineer
Microsoft Azure | Jun 2016 – Dec 2018 | Redmond, WA
• Built hybrid cloud solutions integrating on-premises data centers with Azure cloud services
• Implemented disaster recovery strategies with RPO < 1 hour and RTO < 4 hours

EDUCATION

Georgia Institute of Technology
Master of Science in Computer Science | 2014 – 2016

SKILLS
AWS, Azure, GCP, Terraform, Kubernetes, Docker, Python, Go`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    // Descriptions should be multi-line, not truncated
    const awsEntry = parsed.experience?.find(e => e.company.includes("Amazon") || e.company.includes("AWS"));
    expect(awsEntry?.description?.length).toBeGreaterThan(100);
  });

  // ─── FORMAT 8: Skills as comma-separated list ───
  it("Format 8: Skills as comma-separated list", () => {
    const text = `TOM LEE
Frontend Developer

EXPERIENCE

React Developer
Airbnb | 2020 – Present | San Francisco
• Built responsive web applications

SKILLS
JavaScript, TypeScript, React, Vue.js, Angular, HTML5, CSS3, SASS, Webpack, Babel, ESLint, Prettier, Jest, Cypress, Git, GitHub, npm, yarn, REST APIs, GraphQL, Redux, MobX, Next.js, Gatsby`;

    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(10);
  });

  // ─── FORMAT 9: Skills with categories ───
  it("Format 9: Skills with category headers", () => {
    const text = `EMMA DAVIS
Full Stack Developer

EXPERIENCE

Full Stack Developer
Shopify | 2019 – Present | Toronto
• Built e-commerce platform features

SKILLS

Frontend: React, Vue.js, TypeScript, HTML5, CSS3
Backend: Node.js, Python, Django, FastAPI
Database: PostgreSQL, MongoDB, Redis
DevOps: Docker, Kubernetes, AWS, CI/CD
Tools: Git, Jira, Confluence`;

    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(8);
  });

  // ─── FORMAT 10: Education with complex format ───
  it("Format 10: Education with GPA and honors", () => {
    const text = `CHRIS WILSON
Software Engineer

EDUCATION

Bachelor of Science in Computer Science
Massachusetts Institute of Technology (MIT) | Cambridge, MA
Graduated: May 2020 | GPA: 3.9/4.0 | Dean's List, Magna Cum Laude

Master of Business Administration
Stanford Graduate School of Business | Stanford, CA
Graduated: June 2022 | Concentration: Technology Management

EXPERIENCE

Software Engineer
Apple | 2022 – Present | Cupertino
• Developed iOS accessibility features`;

    const parsed = parseRawResumeText(text);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(2);
  });

  // ─── FORMAT 11: Executive resume with long descriptions ───
  it("Format 11: Executive resume with detailed descriptions", () => {
    const text = `JENNIFER TAYLOR
Chief Technology Officer

EXECUTIVE SUMMARY
Visionary technology executive with 20+ years of experience leading global engineering organizations. Proven track record of building high-performance teams, driving digital transformation, and delivering innovative solutions at scale.

PROFESSIONAL EXPERIENCE

Chief Technology Officer
GlobalTech Inc. | Jan 2020 – Present | New York, NY
• Spearheaded company-wide digital transformation initiative resulting in $50M annual cost savings
• Built and led global engineering organization of 500+ engineers across 12 countries
• Architected microservices migration from monolithic legacy system, improving deployment frequency by 10x
• Established engineering culture of innovation, resulting in 15 patents filed in 3 years
• Partnered with business stakeholders to align technology strategy with company growth objectives

VP of Engineering
TechScale Corp. | Mar 2016 – Dec 2019 | San Francisco, CA
• Scaled engineering team from 50 to 200 engineers while maintaining high hiring bar
• Launched 5 major product initiatives generating $200M in new revenue
• Implemented SRE practices reducing production incidents by 75%

EDUCATION

Master of Business Administration
Harvard Business School | 2014 – 2016

Bachelor of Science in Computer Science
Carnegie Mellon University | 1998 – 2002

SKILLS
Leadership, Strategy, Cloud Architecture, Digital Transformation, Team Building, Agile, Scrum`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    const ctoEntry = parsed.experience?.find(e => e.position.includes("Chief") || e.position.includes("CTO"));
    expect(ctoEntry?.description?.length).toBeGreaterThan(200);
  });

  // ─── FORMAT 12: International resume (UK format) ───
  it("Format 12: International resume with different date format", () => {
    const text = `OLIVER SMITH
Software Developer

PROFILE
Experienced developer with expertise in Python and machine learning.

CAREER HISTORY

Senior Developer | BBC | Jan 2021 – Present | London
• Developed content recommendation engine
• Improved user engagement by 25%

Developer | HSBC | Jul 2018 – Dec 2020 | London
• Built regulatory reporting system
• Automated compliance checks

QUALIFICATIONS

MSc Computer Science | University of Oxford | 2016 – 2017
BSc Computer Science | University of Manchester | 2013 – 2016

TECHNICAL SKILLS
Python, Java, SQL, TensorFlow, PyTorch, AWS, Git`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
  });

  // ─── FORMAT 13: Freelancer resume ───
  it("Format 13: Freelancer with multiple short engagements", () => {
    const text = `MARIA GARCIA
Freelance UX Designer

EXPERIENCE

Freelance UX/UI Designer | Self-Employed | 2019 – Present | Remote
• Redesigned e-commerce checkout flow for Shopify merchant, increasing conversion by 18%
• Created design system for SaaS startup, reducing design-to-dev handoff time by 40%
• Conducted user research with 50+ participants across 5 projects

Contract UX Designer | Toptal | 2018 – 2019 | Remote
• Designed mobile app for fintech client
• Created interactive prototypes and user flows

EDUCATION

Bachelor of Fine Arts in Graphic Design
Parsons School of Design | 2014 – 2018

SKILLS
Figma, Sketch, Adobe XD, InVision, User Research, Prototyping, Wireframing, Design Systems`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
  });

  // ─── FORMAT 14: Career change resume ───
  it("Format 14: Career change with transferable skills", () => {
    const text = `ROBERT CHEN
Data Scientist (Former Teacher)

PROFESSIONAL SUMMARY
Former high school mathematics teacher transitioning to data science, bringing strong analytical skills, communication abilities, and experience with educational technology.

RELEVANT EXPERIENCE

Mathematics Teacher
Lincoln High School | Aug 2016 – Jun 2023 | Boston, MA
• Developed data-driven curriculum improvements using student performance analytics
• Created automated grading system using Python, reducing grading time by 60%
• Led school's digital transformation initiative

DATA SCIENCE PROJECTS

Student Performance Prediction Model
• Built ML model predicting student outcomes with 85% accuracy
• Tech: Python, scikit-learn, pandas, matplotlib

EDUCATION

Master of Education | Boston University | 2016
Bachelor of Mathematics | UCLA | 2014

SKILLS
Python, R, SQL, Machine Learning, Statistics, Data Visualization, Tableau, Excel`;

    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(5);
  });

  // ─── FORMAT 15: Minimal resume ───
  it("Format 15: Minimal resume with few sections", () => {
    const text = `ALEX JOHNSON
Developer

SKILLS
JavaScript, React, Node.js

EXPERIENCE

Frontend Developer
Startup Inc | 2022 – Present
• Built company website`;

    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(2);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(1);
  });
});

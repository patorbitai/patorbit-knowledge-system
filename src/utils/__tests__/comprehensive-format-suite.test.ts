import { describe, it, expect } from "vitest";
import { parseRawResumeText, rawToResume } from "../resume-parser";

/**
 * COMPREHENSIVE RESUME FORMAT TEST SUITE
 *
 * This test suite covers every common resume format found in the wild.
 * Sources: Canva, Resume.io, Zety, Novoresume, Indeed, LinkedIn export,
 * and common PDF extraction artifacts.
 *
 * RULE: If ANY test fails, the parser must be fixed before deployment.
 * This prevents the "fix one format, break another" cycle.
 */

// Helper to verify basic structure
function assertValidResume(parsed: ReturnType<typeof parseRawResumeText>, label: string) {
  if (!parsed.name && !parsed.email && !parsed.phone) {
    throw new Error(`${label}: No personal info detected at all`);
  }
}

describe("Comprehensive Resume Format Suite", () => {

  // ═══════════════════════════════════════════════════════════
  // CATEGORY A: Standard formats (US, UK, Canadian, Australian)
  // ═══════════════════════════════════════════════════════════

  it("A1: Standard US resume (Google Docs template)", () => {
    const text = `JOHN SMITH
Software Engineer | San Francisco, CA
john@email.com | (555) 123-4567 | linkedin.com/in/johnsmith

SUMMARY
Experienced software engineer with 5+ years building scalable web applications.

EXPERIENCE
Senior Software Engineer
Google | Mountain View, CA | Jan 2020 – Present
• Led development of microservices architecture serving 10M+ users
• Reduced API response time by 40% through caching optimization
• Mentored team of 5 junior engineers

Software Engineer
Meta | Menlo Park, CA | Jun 2017 – Dec 2019
• Built real-time data processing pipelines
• Implemented A/B testing framework

EDUCATION
Stanford University | Master of Science in Computer Science | 2015 – 2017

SKILLS
JavaScript, TypeScript, Python, React, Node.js, AWS, Docker, Kubernetes

PROJECTS
Open Source CLI Tool
Built a command-line tool for data pipeline automation. Tech: Python, Click, PostgreSQL`;
    const parsed = parseRawResumeText(text);
    expect(parsed.name).toBe("JOHN SMITH");
    expect(parsed.email).toBe("john@email.com");
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(5);
    assertValidResume(parsed, "A1");
  });

  it("A2: UK-style resume with Profile and Career History", () => {
    const text = `OLIVER JONES
Software Developer | London, UK
oliver.jones@email.co.uk | +44 7700 123456

PROFILE
Experienced developer with expertise in Python and cloud infrastructure.

CAREER HISTORY

Senior Developer | BBC | Jan 2021 – Present | London
• Developed content recommendation engine serving 50M users
• Improved page load time by 35%

Developer | HSBC | Jul 2018 – Dec 2020 | London
• Built regulatory reporting system
• Automated compliance checks using Python

QUALIFICATIONS

MSc Computer Science | University of Oxford | 2016 – 2017
BSc Computer Science | University of Manchester | 2013 – 2016

TECHNICAL SKILLS
Python, Java, SQL, AWS, Docker, Git, Terraform`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
    assertValidResume(parsed, "A2");
  });

  it("A3: Australian resume with Referee section", () => {
    const text = `SARAH WILLIAMS
Data Analyst | Melbourne, Australia
sarah.w@email.com | +61 400 123 456

CAREER PROFILE
Data analyst with 4 years of experience in business intelligence.

EMPLOYMENT HISTORY

Senior Data Analyst | ANZ Bank | Mar 2021 – Present | Melbourne
• Built executive dashboards using Power BI
• Automated monthly reporting, saving 20 hours/week

Data Analyst | Telstra | Jan 2019 – Feb 2021 | Melbourne
• Analysed customer churn patterns
• Created predictive models with 85% accuracy

EDUCATION
Bachelor of Science (Data Science) | University of Melbourne | 2015 – 2018

KEY SKILLS
SQL, Python, Power BI, Tableau, Excel, SAS, Machine Learning

REFEREES
Available upon request`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "A3");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY B: Header variations (different section names)
  // ═══════════════════════════════════════════════════════════

  it("B1: About Me instead of Summary", () => {
    const text = `EMMA BROWN
Marketing Manager
emma@company.com

ABOUT ME
Creative marketing professional with 7+ years in digital marketing and brand strategy.

WORK EXPERIENCE
Marketing Director | Nike | 2021 – Present | Portland, OR
• Led global brand campaign generating $10M in revenue

Marketing Manager | Adidas | 2018 – 2020 | Herzogenaurach
• Managed social media strategy across 15 markets

EDUCATION
MBA | Wharton School | 2016 – 2018
BA Marketing | NYU | 2012 – 2016

TOOLS
Google Analytics, HubSpot, Salesforce, Hootsuite, Adobe Creative Suite`;
    const parsed = parseRawResumeText(text);
    expect(parsed.summary).toBeTruthy();
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "B1");
  });

  it("B2: Objective instead of Summary", () => {
    const text = `ALEX TURNER
Junior Developer
alex@startup.io

OBJECTIVE
Recent computer science graduate seeking a junior developer role to apply skills in React and Node.js.

EXPERIENCE
Software Engineering Intern | Stripe | Jun 2023 – Aug 2023 | SF
• Built internal tool for transaction monitoring
• Wrote 2000+ lines of production TypeScript

EDUCATION
BS Computer Science | UC Berkeley | 2019 – 2023 | GPA: 3.7

SKILLS
React, TypeScript, Node.js, PostgreSQL, Git, AWS`;
    const parsed = parseRawResumeText(text);
    expect(parsed.summary).toBeTruthy();
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "B2");
  });

  it("B3: Core Competencies as skills section", () => {
    const text = `MICHAEL DAVIS
Product Manager
michael@tech.com | (555) 987-6543

SUMMARY
Product manager with 8 years of experience in SaaS.

EXPERIENCE
Senior PM | Salesforce | 2020 – Present | SF
• Launched enterprise analytics platform

PM | HubSpot | 2017 – 2020 | Boston
• Grew product adoption by 200%

EDUCATION
MBA | Kellogg School of Management | 2015 – 2017

CORE COMPETENCIES
Product Strategy, Agile/Scrum, SQL, A/B Testing, User Research, Roadmapping, Jira, Figma, Data Analysis, Go-to-Market Strategy`;
    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(5);
    assertValidResume(parsed, "B3");
  });

  it("B4: Technical Expertise section", () => {
    const text = `LISA PARK
Backend Engineer
lisa@dev.com

SUMMARY
Backend engineer specializing in distributed systems.

EXPERIENCE
Senior Engineer | Netflix | 2020 – Present | LA
• Built content delivery optimization system

Engineer | AWS | 2018 – 2020 | Seattle
• Designed auto-scaling infrastructure

EDUCATION
MS Computer Science | Georgia Tech | 2016 – 2018

TECHNICAL EXPERTISE
Java, Go, Python, Kafka, Redis, PostgreSQL, MongoDB, AWS, Kubernetes, Docker, CI/CD, Microservices`;
    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(8);
    assertValidResume(parsed, "B4");
  });

  it("B5: Key Skills and Proficiencies section", () => {
    const text = `ROBERT LEE
Financial Analyst
robert@finance.com

SUMMARY
CFA charterholder with 5 years in equity research.

EXPERIENCE
Senior Analyst | Goldman Sachs | 2021 – Present | NYC
• Covered technology sector with $2B AUM

Analyst | JPMorgan | 2019 – 2020 | NYC
• Built financial models for M&A transactions

EDUCATION
MBA Finance | Columbia Business School | 2017 – 2019
BS Economics | UPenn | 2013 – 2017

KEY SKILLS AND PROFICIENCIES
Financial Modeling, Valuation, DCF, Comparable Analysis, Bloomberg Terminal, Excel, Python, SQL, PowerPoint, Equity Research`;
    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(5);
    assertValidResume(parsed, "B5");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY C: Separator and layout variations
  // ═══════════════════════════════════════════════════════════

  it("C1: Pipe-separated experience (Company | Role | Date)", () => {
    const text = `DAVID KIM
Backend Engineer
david@stripe.com

EXPERIENCE
Stripe | Senior Backend Engineer | 2020 – Present
• Designed payment processing system handling 10M daily transactions
• Reduced fraud rate by 30%

Square | Backend Engineer | 2018 – 2020
• Built merchant analytics platform
• Implemented real-time fraud detection

EDUCATION
UC Berkeley | BS Computer Science | 2014 – 2018

SKILLS
Go, Python, PostgreSQL, Redis, Kafka, gRPC`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "C1");
  });

  it("C2: Tabular format with position first", () => {
    const text = `ANNA WANG
Data Scientist | anna@ml.com | San Francisco

EXPERIENCE
Senior Data Scientist, Spotify | 2021 – Present | New York
• Built music recommendation engine serving 400M users
• Developed NLP model for podcast search

Data Scientist, Uber | 2019 – 2021 | San Francisco
• Created demand forecasting model
• Analyzed rider behavior patterns

EDUCATION
MS Data Science, Stanford University | 2017 – 2019
BS Mathematics, MIT | 2013 – 2017

SKILLS
Python, R, TensorFlow, PyTorch, SQL, Spark, AWS`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "C2");
  });

  it("C3: Bullet-point heavy with em-dash separators", () => {
    const text = `CHRIS MARTIN
UX Designer — chris@design.co

EXPERIENCE
Lead UX Designer — Figma — 2021 – Present — San Francisco
• Redesigned core editing experience
• Conducted 100+ user interviews
• Increased user satisfaction by 25%

UX Designer — Airbnb — 2018 – 2020 — San Francisco
• Designed host onboarding flow
• Created design system components

EDUCATION
BFA Interaction Design — School of Visual Arts — 2014 – 2018

SKILLS
Figma, Sketch, Adobe XD, Prototyping, User Research, Design Systems`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "C3");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY D: PDF extraction artifacts
  // ═══════════════════════════════════════════════════════════

  it("D1: Spaced-out all-caps headers (PDF artifact)", () => {
    const text = `JAMES WILSON
Cloud Engineer

EX P E R I E N C E
Senior Cloud Engineer | AWS | 2020 – Present | Seattle
• Designed multi-region infrastructure
• Reduced costs by 40%

Cloud Engineer | Azure | 2018 – 2020 | Redmond
• Migrated 200+ workloads to cloud
• Implemented CI/CD pipelines

ED U C A T I O N
MS Computer Science | University of Washington | 2016 – 2018

SK I L L S
AWS, Azure, GCP, Terraform, Kubernetes, Docker, Python`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
    assertValidResume(parsed, "D1");
  });

  it("D2: Spaced compound headers (PROFESSIONAL EXPERIENCE)", () => {
    const text = `KAREN LEE
DevOps Engineer

PR O F E S S I O N A L  E X P E R I E N C E
Senior DevOps Engineer | Netflix | 2021 – Present | LA
• Built CI/CD pipeline serving 200M users
• Reduced deployment time from hours to minutes

DevOps Engineer | Spotify | 2019 – 2020 | Stockholm
• Managed Kubernetes clusters across 3 regions
• Implemented monitoring and alerting

CO R E C O M P E T E N C I E S
AWS, Azure, Kubernetes, Docker, Terraform, Ansible, Jenkins, GitLab CI

ED U C AT I O N
BS Computer Science | KTH Royal Institute | 2015 – 2019`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
    assertValidResume(parsed, "D2");
  });

  it("D3: Mixed spacing (some headers spaced, some not)", () => {
    const text = `TOM BAKER
Security Engineer

PROFESSIONAL EXPERIENCE
Senior Security Engineer | CrowdStrike | 2020 – Present | Austin
• Led incident response for Fortune 500 clients
• Developed automated threat detection tools

Security Engineer | Palo Alto Networks | 2018 – 2020 | Santa Clara
• Built SIEM dashboards
• Conducted penetration testing

EDUCATION
MS Cybersecurity | Georgia Tech | 2016 – 2018

KEY SKILLS
Python, Splunk, Wireshark, Nessus, Metasploit, AWS Security`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
    assertValidResume(parsed, "D3");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY E: Content-heavy formats
  // ═══════════════════════════════════════════════════════════

  it("E1: Executive resume with long bullet points", () => {
    const text = `JENNIFER TAYLOR
Chief Technology Officer | jen@tech.com | New York

EXECUTIVE SUMMARY
Visionary technology executive with 20+ years of experience leading global engineering organizations. Proven track record of building high-performance teams, driving digital transformation, and delivering innovative solutions at scale.

PROFESSIONAL EXPERIENCE

Chief Technology Officer
GlobalTech Inc. | Jan 2020 – Present | New York, NY
• Spearheaded company-wide digital transformation initiative resulting in $50M annual cost savings through cloud migration and process automation
• Built and led global engineering organization of 500+ engineers across 12 countries with 95% retention rate
• Architected microservices migration from monolithic legacy system, improving deployment frequency from monthly to multiple times daily
• Established engineering culture of innovation, resulting in 15 patents filed in 3 years
• Partnered with business stakeholders to align technology strategy with company growth objectives, directly contributing to 3x revenue growth

VP of Engineering
TechScale Corp. | Mar 2016 – Dec 2019 | San Francisco, CA
• Scaled engineering team from 50 to 200 engineers while maintaining high hiring bar and cultural alignment
• Launched 5 major product initiatives generating $200M in new annual recurring revenue
• Implemented SRE practices reducing production incidents by 75% and improving system reliability to 99.99%

EDUCATION
Master of Business Administration | Harvard Business School | 2014 – 2016
Bachelor of Science in Computer Science | Carnegie Mellon University | 1998 – 2002

LEADERSHIP
Leadership, Strategy, Cloud Architecture, Digital Transformation, Team Building, Board Presentations, P&L Management`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    const ctoEntry = parsed.experience?.find(e => e.position.includes("Chief") || e.position.includes("CTO"));
    expect(ctoEntry?.description?.length).toBeGreaterThan(200);
    assertValidResume(parsed, "E1");
  });

  it("E2: Multi-page experience with many entries", () => {
    const text = `MIKE CHEN
Software Engineer

EXPERIENCE
Staff Engineer | Google | 2022 – Present | Mountain View
• Led migration of 50 services to gRPC
• Mentored 20 engineers across 3 teams

Senior Engineer | Google | 2019 – 2022 | Mountain View
• Built real-time collaboration features
• Reduced backend latency by 60%

Engineer | Google | 2017 – 2019 | Mountain View
• Developed search indexing pipeline
• Implemented A/B testing framework

Software Engineer | Startup A | 2015 – 2017 | SF
• First engineer, built MVP from scratch
• Scaled to 100K users in 6 months

Junior Developer | Startup B | 2013 – 2015 | SF
• Built customer-facing web application
• Implemented payment processing integration

EDUCATION
MS Computer Science | Stanford | 2011 – 2013
BS Computer Science | UC Berkeley | 2007 – 2011

SKILLS
Java, C++, Python, Go, gRPC, Protobuf, Kubernetes, Spanner`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(4);
    assertValidResume(parsed, "E2");
  });

  it("E3: Skills with categories and colons", () => {
    const text = `SARAH JONES
Full Stack Developer

EXPERIENCE
Full Stack Developer | Shopify | 2019 – Present | Toronto
• Built e-commerce platform features

SKILLS
Frontend: React, Vue.js, TypeScript, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Python, Django, FastAPI, GraphQL
Database: PostgreSQL, MongoDB, Redis, Elasticsearch
DevOps: Docker, Kubernetes, AWS, CI/CD, GitHub Actions
Testing: Jest, Cypress, Playwright, React Testing Library
Tools: Git, Jira, Confluence, Figma, Notion`;
    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(10);
    assertValidResume(parsed, "E3");
  });

  it("E4: Categorized skills without colons", () => {
    const text = `ALEX PARK
Data Engineer

EXPERIENCE
Data Engineer | Snowflake | 2021 – Present | San Mateo
• Built data pipelines processing 1TB daily

SKILLS

Cloud & Data Engineering
Azure Data Factory  Azure Databricks  PySpark  Azure Synapse Analytics  ADLS Gen2  Azure SQL

Programming & Data
Python  SQL  REST APIs  JSON/JSONB  Data Validation  Data Quality

AI / ML
Machine Learning  NLP  LLMs  RAG  Embeddings  Vector Search

Databases & Analytics
PostgreSQL  Power BI  Relational Database Design  Database Migrations`;
    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(8);
    assertValidResume(parsed, "E4");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY F: Education and certifications formats
  // ═══════════════════════════════════════════════════════════

  it("F1: Education with bullet points", () => {
    const text = `PATRICIA MOORE
Software Engineer

EXPERIENCE
Engineer | Microsoft | 2020 – Present | Redmond
• Built Azure Functions runtime

EDUCATION
Bachelor of Science in Computer Science
University of Washington | 2016 – 2020
• GPA: 3.8/4.0
• Dean's List all semesters
• Relevant Coursework: Data Structures, Algorithms, Operating Systems

Master of Science in Computer Science
Carnegie Mellon University | 2020 – 2022
• Thesis: Distributed Systems Optimization
• Teaching Assistant for Advanced Algorithms

SKILLS
C#, .NET, Azure, TypeScript, React`;
    const parsed = parseRawResumeText(text);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "F1");
  });

  it("F2: Certifications as bullet list", () => {
    const text = `KEVIN BROWN
Cloud Architect

EXPERIENCE
Cloud Architect | Deloitte | 2021 – Present | Chicago
• Led cloud migration for Fortune 100 client

EDUCATION
MS Information Systems | University of Illinois | 2017 – 2019

SKILLS
AWS, Azure, GCP, Terraform, CloudFormation

CERTIFICATIONS
• AWS Solutions Architect – Professional (2023)
• Google Cloud Professional Architect (2022)
• Azure Solutions Architect Expert (2021)
• Certified Kubernetes Administrator (2020)`;
    const parsed = parseRawResumeText(text);
    expect(parsed.certifications?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "F2");
  });

  it("F3: Education inline format (Degree, School, Year)", () => {
    const text = `NANCY ADAMS
Financial Analyst

EXPERIENCE
Analyst | McKinsey | 2020 – Present | NYC
• Built financial models for PE clients

EDUCATION
MBA, Finance, Wharton School of Business, 2018
BS Economics, London School of Economics, 2016

SKILLS
Financial Modeling, DCF, Valuation, Excel, Python, SQL`;
    const parsed = parseRawResumeText(text);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "F3");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY G: Minimal and unconventional
  // ═══════════════════════════════════════════════════════════

  it("G1: Minimal resume (skills + one job)", () => {
    const text = `ALEX JOHNSON
Frontend Developer

SKILLS
JavaScript, React, Vue.js, TypeScript, HTML5, CSS3

EXPERIENCE
Frontend Developer | Startup Inc | 2022 – Present
• Built company website and admin dashboard
• Implemented responsive design system`;
    const parsed = parseRawResumeText(text);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "G1");
  });

  it("G2: No section headers at all (continuous text)", () => {
    const text = `JANE DOE
Marketing Specialist
jane@email.com | (555) 111-2222

Jane is a marketing specialist with 3 years of experience at Google and Facebook. She has expertise in digital marketing, SEO, and content strategy. Jane holds an MBA from Harvard and a BA from Yale.`;
    const parsed = parseRawResumeText(text);
    expect(parsed.name).toBe("JANE DOE");
    expect(parsed.email).toBe("jane@email.com");
    assertValidResume(parsed, "G2");
  });

  it("G3: Resume with URL-heavy contact section", () => {
    const text = `CARLOS RIVERA
Full Stack Developer
carlos@dev.io
linkedin.com/in/carlosrivera
github.com/carlosrivera
carlosrivera.dev

EXPERIENCE
Senior Developer | Vercel | 2021 – Present | SF
• Built Next.js deployment platform features

Developer | Netlify | 2019 – 2021 | SF
• Implemented serverless function runtime

EDUCATION
BS Computer Science | UT Austin | 2015 – 2019

SKILLS
Next.js, React, Node.js, TypeScript, Vercel, Cloudflare`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "G3");
  });

  it("G4: Resume withlanguages and interests", () => {
    const text = `MARIA SANTOS
International Business Manager

EXPERIENCE
Regional Director | Unilever | 2020 – Present | Sao Paulo
• Managed operations across 5 South American countries
• Increased regional revenue by 30%

LANGUAGES
Portuguese (Native), English (Fluent), Spanish (Fluent), French (Conversational)

INTERESTS
International travel, marathon running, volunteer teaching`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "G4");
  });

  it("G5: Resume with numbered bullet points", () => {
    const text = `PETER HALL
Project Manager

EXPERIENCE
Senior PM | Microsoft | 2020 – Present | Redmond
1. Led Azure DevOps product launch
2. Managed cross-functional team of 20
3. Delivered project 2 weeks ahead of schedule
4. Reduced customer churn by 15%

PM | Atlassian | 2018 – 2020 | Sydney
1. Launched Jira mobile app
2. Grew user base by 200%

EDUCATION
MBA | INSEAD | 2016 – 2017

SKILLS
Agile, Scrum, Jira, Confluence, Risk Management, Stakeholder Management`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "G5");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY H: Edge cases
  // ═══════════════════════════════════════════════════════════

  it("H1: Experience without clear company/position headers", () => {
    const text = `DANIEL FISH
DevOps Engineer

EXPERIENCE

At Amazon Web Services (2020-2023) I led the cloud infrastructure team, managing over 500 EC2 instances and implementing auto-scaling policies. I also built CI/CD pipelines using Jenkins and GitHub Actions.

Before that, at Netflix (2018-2020), I worked on the content delivery network, optimizing video streaming for 200M+ subscribers. I implemented CDN caching strategies that reduced bandwidth costs by 35%.

EDUCATION
BS Computer Science | University of Michigan | 2014 – 2018

SKILLS
AWS, Terraform, Jenkins, GitHub Actions, Docker, Kubernetes, Python`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "H1");
  });

  it("H2: Resume with parenthetical dates", () => {
    const text = `SUSAN WHITE
Accountant

EXPERIENCE
Senior Accountant | PwC (2020 - Present) | NYC
• Managed audit engagements for Fortune 500 clients
• Led team of 8 associates

Staff Accountant | Deloitte (2018 - 2020) | NYC
• Prepared financial statements
• Conducted tax research

EDUCATION
BS Accounting | NYU Stern | 2014 – 2018

SKILLS
GAAP, IFRS, QuickBooks, SAP, Excel, SQL`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "H2");
  });

  it("H3: Single-column resume with dense text", () => {
    const text = `RACHEL GREEN
Environmental Scientist
rachel@green.org | (555) 333-4444

SUMMARY
Environmental scientist with 6 years of experience in water quality research and remediation.

EXPERIENCE
Senior Environmental Scientist | EPA | 2021 – Present | Washington DC
Conducted water quality assessments for major river systems. Developed remediation plans for contaminated sites. Managed $2M annual research budget. Published 5 peer-reviewed papers.

Environmental Scientist | AECOM | 2018 – 2020 | Denver
Performed environmental impact assessments. Collected and analyzed field samples. Prepared regulatory compliance reports.

EDUCATION
MS Environmental Science | Duke University | 2016 – 2018
BS Chemistry | UNC Chapel Hill | 2012 – 2016

SKILLS
Water Quality Analysis, GIS, ArcGIS, R, Python, Environmental Regulation, EPA Compliance, Report Writing`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "H3");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY I: The Arvind PDF formats (regression guard)
  // ═══════════════════════════════════════════════════════════

  it("I1: Arvind-style spaced PDF with compound section headers", () => {
    // This is the exact format from the 355KB ARVIND CHAUHAN.pdf
    const text = `ARVIND ABHAY NARAYAN CHAUHAN
DATA ENGINEER | AI/ML ENGINEER | DATA AUTOMATION
carvind35@gmail.com 9226232697 Mumbai, India

EX E C U T I V E S U M M A RY
Data Engineer with 3+ years of professional experience in data engineering.

PR O F E S S I O N A L E X P E R I E N C E
PystackJs Pvt. Ltd. (MarsDevs) Jan 2024 – Apr 2024
Machine Learning Engineer · Pune
• Worked on Python-based machine-learning workflows
• Prepared and processed data

People Tech Group Apr 2022 – Jan 2024
Data Engineer · Hyderabad
• Developed Azure Data Factory pipelines
• Built transformation workflows

Upwork - Freelance May 2020 – Apr 2022
Data Analyst · Remote
• Extracted client-specified information
• Used Python and SQL for data processing

CO R E C O M P E T E N C I E S
Cloud & Data Engineering: Azure Data Factory PySpark Azure SQL

KE Y P R O J E C T S
Enterprise GenAI / RAG Data Pipeline
• Built document-ingestion workflows

ED U C AT I O N
Bharathiar University 2016–2018
Master of Business Administration (MBA)

CE RT I F I C AT I O N S
Microsoft Certified: Azure Data Engineer Associate

LA N G UA G E S
English (Fluent) Hindi (Fluent)`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(1);
    expect(parsed.projects?.length).toBeGreaterThanOrEqual(1);
    assertValidResume(parsed, "I1");
  });

  it("I2: Standard format with • separators in experience", () => {
    const text = `NINA PATEL
Data Engineer

WORK EXPERIENCE
PystackJs Pvt. Ltd. (MarsDevs) • January 2024 – April 2024 • Pune, India
Machine Learning Engineer
• Worked on Python-based machine-learning and data-processing workflows
• Prepared and processed data for experimentation

People Tech Group • April 2022 – January 2024 • Hyderabad, India
Data Engineer
• Developed Azure Data Factory pipelines
• Built transformation workflows using PySpark

SKILLS
Python, SQL, Azure Data Factory, PySpark, Azure Synapse

EDUCATION
Bharathiar University • 2016–2018
MBA`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.education?.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills!.length).toBeGreaterThanOrEqual(3);
    assertValidResume(parsed, "I2");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY J: Freelancer and contractor formats
  // ═══════════════════════════════════════════════════════════

  it("J1: Freelancer with multiple short contracts", () => {
    const text = `MARIA GARCIA
Freelance UX Designer

EXPERIENCE

Freelance UX/UI Designer | Self-Employed | 2019 – Present | Remote
• Redesigned e-commerce checkout flow for Shopify merchant, increasing conversion by 18%
• Created design system for SaaS startup

Contract UX Designer | Toptal | 2018 – 2019 | Remote
• Designed mobile app for fintech client
• Created interactive prototypes

UX Intern | Design Agency | 2017 – 2018 | Barcelona
• Assisted with wireframing and user research

EDUCATION
BFA Graphic Design | Parsons School of Design | 2013 – 2017

SKILLS
Figma, Sketch, Adobe XD, InVision, User Research, Prototyping`;
    const parsed = parseRawResumeText(text);
    expect(parsed.experience?.length).toBeGreaterThanOrEqual(2);
    assertValidResume(parsed, "J1");
  });

  // ═══════════════════════════════════════════════════════════
  // CATEGORY K: rawToResume integration
  // ═══════════════════════════════════════════════════════════

  it("K1: rawToResume produces valid Resume object for standard format", () => {
    const text = `JOHN DOE
Software Engineer | john@email.com

EXPERIENCE
Senior Engineer | Google | 2020 – Present
• Built search features

Engineer | Meta | 2018 – 2020
• Built news feed

EDUCATION
BS CS | MIT | 2014 – 2018

SKILLS
Python, Java, C++, Go`;
    const resume = rawToResume(text);
    expect(resume.name).toBe("JOHN DOE");
    expect(resume.email).toBe("john@email.com");
    expect(resume.experience.length).toBeGreaterThanOrEqual(2);
    expect(resume.education.length).toBeGreaterThanOrEqual(1);
    expect(resume.skills.length).toBeGreaterThanOrEqual(3);
    // Verify IDs are assigned
    resume.experience.forEach((e, i) => expect(e.id).toBe(i + 1));
    resume.skills.forEach((s, i) => expect(s.id).toBe(i + 1));
  });

  it("K2: rawToResume handles minimal input gracefully", () => {
    const text = `Jane Smith
Developer`;
    const resume = rawToResume(text);
    expect(resume.name).toBe("Jane Smith");
    expect(resume.experience.length).toBe(0);
    expect(resume.education.length).toBe(0);
    expect(resume.skills.length).toBe(0);
  });

  it("K3: rawToResume handles empty input", () => {
    const resume = rawToResume("");
    expect(resume.name).toBe("");
    expect(resume.experience.length).toBe(0);
  });
});

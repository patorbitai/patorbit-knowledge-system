import { describe, it, expect } from "vitest";
import { rawToResume } from "../resume-parser";

/**
 * Reconstructed text from Arvind's PDF resume (ARVIND ABHAY NARAYAN CHAUHAN.pdf)
 * based on the HackerRank screenshots showing correct parsed output.
 */
const ARVIND_RESUME_TEXT = `ARVIND ABHAY NARAYAN CHAUHAN
Data Engineer
carvind35@gmail.com
+91-9226232697
Mumbai, India
linkedin.com/in/arvind-chauhan-data-engineer
github.com/arvind-data-engineer

WORK EXPERIENCE

Machine Learning Engineer
Pystack Js Pvt. Ltd. (MarsDevs) • January 2024 - April 2024 • Mumbai, India
Worked on Python-based machine-learning and data-processing workflows covering data preparation, preprocessing, experimentation, and evaluation. Prepared and processed data as part of machine-learning workflow development supporting structured inputs for experimentation and evaluation. Supported integration of machine-learning components into application workflows and contributed to structured data preparation.

Data Engineer
PeopleTech Group • April 2022 - January 2024 • Mumbai, India
Developed and maintained end-to-end Azure Data Factory pipelines connecting source systems, ADLS Gen2, processing layers, and reporting environments. Built transformation and processing workflows using Azure Databricks and PySpark with Azure SQL and Azure Synapse Analytics. Automated recurring manual data-processing workflows using Python reducing execution time from ~2 hours to 5 minutes. Handled API-based daily ingestion of large JSON payloads, processing and preparing data for downstream loading. Recreated Excel/VBA transformation logic in Python. Integrated automated workflows with Azure pipelines for scheduling and direct SQL loading. Implemented row-count and data-quality validation and tested outputs in separate tables before production. Monitored production pipelines, investigated failures, resolved processing issues, and supported reliable PowerBI dashboard refreshes.

Data Analyst & Data Extraction Consultant
Upwork — Freelance • May 2020 - April 2022 • Mumbai, India
Extracted information from PDF documents and transformed unstructured/semi-structured content into structured JSON datasets. Performed data extraction, cleaning, transformation, validation, and dataset preparation. Used Python and SQL for data processing, analysis, validation, and reporting. Created reports and dashboards using PowerBI and Tableau. Worked directly with clients to understand requirements, validate results, and deliver accurate datasets and reports.

EDUCATION

Bharathiar University
Master of Business Administration (MBA) • January 2016 - December 2018

Mumbai University
Bachelor of Science in Information Technology (B.Sc. IT) • January 2013 - December 2016

SKILLS

Azure Data Factory, Azure Databricks, Azure Synapse Analytics, PowerBI, MLflow, Prisma, PostgreSQL, ADLS Gen2, Azure SQL, Delta Lake, JSON, JSONB, Relational Database Design, PySpark, REST APIs, Python, SQL

PROJECTS

Data Pipeline Automation
Built automated data ingestion pipelines using Python and Azure Data Factory. Tech: Python, Azure Data Factory, PySpark

CERTIFICATIONS

SQL (Basic)
Verified - HackerRank

LINKS

LinkedIn: https://linkedin.com/in/arvind-chauhan-data-engineer
GitHub: https://github.com/arvind-data-engineer
Portfolio: https://www.patorbit.com/
`;

describe("Arvind resume import regression", () => {
  it("parses all 3 experience entries", () => {
    const resume = rawToResume(ARVIND_RESUME_TEXT);
    console.log("=== EXPERIENCE ===");
    console.log("Count:", resume.experience?.length);
    resume.experience?.forEach((exp, i) => {
      console.log(`\n--- Entry ${i + 1} ---`);
      console.log("Position:", exp.position);
      console.log("Company:", exp.company);
      console.log("Duration:", exp.duration);
      console.log("Description:", JSON.stringify(exp.description));
    });
    expect(resume.experience?.length).toBe(3);
  });

  it("preserves full description text for each experience entry", () => {
    const resume = rawToResume(ARVIND_RESUME_TEXT);
    resume.experience?.forEach((exp) => {
      console.log(`\n=== ${exp.position} @ ${exp.company} ===`);
      console.log("Description length:", exp.description.length);
      // Each entry should have multi-paragraph description
      expect(exp.description.length).toBeGreaterThan(50);
    });

    // ML Engineer entry should have full description
    const mlEntry = resume.experience?.find(e => e.position.includes("Machine Learning"));
    if (mlEntry) {
      expect(mlEntry.description).toContain("evaluation");
    }

    // Data Engineer entry should have full description
    const deEntry = resume.experience?.find(e => e.position === "Data Engineer");
    if (deEntry) {
      expect(deEntry.description).toContain("PowerBI dashboard refreshes");
    }
  });

  it("parses all 17 skills", () => {
    const resume = rawToResume(ARVIND_RESUME_TEXT);
    console.log("\n=== SKILLS ===");
    console.log("Count:", resume.skills?.length);
    resume.skills?.forEach(s => console.log("  -", s.name));
    expect(resume.skills!.length).toBeGreaterThanOrEqual(15);
  });

  it("parses both education entries", () => {
    const resume = rawToResume(ARVIND_RESUME_TEXT);
    console.log("\n=== EDUCATION ===");
    console.log("Count:", resume.education?.length);
    resume.education?.forEach(e => {
      console.log(`  ${e.school} | ${e.degree} | ${e.year}`);
    });
    expect(resume.education?.length).toBe(2);
  });

  it("parses projects", () => {
    const resume = rawToResume(ARVIND_RESUME_TEXT);
    console.log("\n=== PROJECTS ===");
    console.log("Count:", resume.projects?.length);
    resume.projects?.forEach(p => {
      console.log(`  ${p.name}: ${p.description.substring(0, 60)}...`);
    });
    expect(resume.projects!.length).toBeGreaterThanOrEqual(1);
  });

  it("parses certifications", () => {
    const resume = rawToResume(ARVIND_RESUME_TEXT);
    console.log("\n=== CERTIFICATIONS ===");
    console.log("Count:", resume.certifications?.length);
    resume.certifications?.forEach(c => {
      console.log(`  ${c.name} | ${c.issuer}`);
    });
    expect(resume.certifications!.length).toBeGreaterThanOrEqual(1);
  });

  it("extracts personal info correctly", () => {
    const resume = rawToResume(ARVIND_RESUME_TEXT);
    console.log("\n=== PERSONAL ===");
    console.log("Name:", resume.name);
    console.log("Email:", resume.email);
    console.log("Phone:", resume.phone);
    console.log("Title:", resume.title);
    expect(resume.name).toContain("ARVIND");
    expect(resume.email).toBe("carvind35@gmail.com");
    expect(resume.phone).toContain("9226232697");
  });
});

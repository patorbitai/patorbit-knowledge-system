"use strict";

/**
 * Shared test fixtures for service unit tests.
 *
 * These are extracted from the GraphMapper tests so all service tests
 * exercise the same realistic career graph shapes.
 */

import type { Resume } from "@/types/resume";

/** A full, realistic "working professional" resume. */
export function createMinimalResume(name: string = "Test User"): Resume {
  return {
    name,
    title: "Developer",
    email: "test@example.com",
    phone: "+1-555-123-4567",
    address: "123 Main St, City",
    nationality: "American",
    pronouns: "he/him",
    summary: "Experienced developer passionate about building great software.",
    social: {
      linkedin: "https://linkedin.com/in/testuser",
      github: "https://github.com/testuser",
      website: "",
      twitter: "",
      portfolio: "",
      stackoverflow: "",
    },
    experience: [
      {
        id: "exp-1",
        company: "Tech Corp",
        position: "Senior Developer",
        location: "San Francisco, CA",
        employmentType: "Full-time",
        industry: "Technology",
        startDate: "2020-01-01",
        endDate: "2024-12-31",
        current: false,
        duration: "4 years",
        description: "Led development of key projects.",
        achievements: "Achieved X metrics",
        techUsed: "React, TypeScript, Node.js",
        bulletPoints: ["Built scalable applications.", "Mentored junior developers."],
      },
    ],
    education: [
      {
        id: "edu-1",
        school: "University of Technology",
        degree: "Bachelor of Science",
        year: "2020",
        field: "Computer Science",
        gpa: "3.8",
        minor: "",
        honors: "Summa Cum Laude",
        activities: "Debate Club, Hackathon Winner",
        location: "City, Country",
      },
    ],
    skills: [
      { id: "skill-1", name: "JavaScript", level: "Advanced", category: "Programming Languages", years: "4" },
      { id: "skill-2", name: "TypeScript", level: "Intermediate", category: "Programming Languages", years: "2" },
      { id: "skill-3", name: "React", level: "Advanced", category: "Frameworks", years: "3" },
    ],
    projects: [
      {
        id: "proj-1",
        name: "E-commerce Platform",
        description: "Full-stack e-commerce solution built with React and Node.js.",
        tech: "React, Node.js, PostgreSQL, Stripe",
        link: "https://example.com/project1",
        startDate: "2022-06-01",
        endDate: "2022-12-31",
        role: "Lead Developer",
        teamSize: "5",
        status: "Completed",
        bulletPoints: [
          "Implemented CI/CD pipeline reducing deployment time by 40%.",
          "Added real-time inventory management feature.",
        ],
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2022-03-15",
        link: "https://example.com/cert/1",
        description: "Advanced architecture design and implementation.",
        expiryDate: "2025-03-15",
        skills: "Cloud, Architecture",
      },
    ],
    languages: [
      { id: "lang-1", name: "English", proficiency: "Native" },
      { id: "lang-2", name: "Spanish", proficiency: "Conversational" },
    ],
    interests: [{ id: "int-1", name: "Open Source Contributions" }],
    achievements: [
      {
        id: "ach-1",
        title: "Employee of the Year",
        description: "Recognized for outstanding technical contributions.",
        date: "2023-12-01",
        issuer: "Tech Corp",
      },
    ],
    references: [
      {
        id: "ref-1",
        name: "Mary Johnson",
        company: "Tech Corp",
        position: "Engineering Manager",
        email: "mary.johnson@techcorp.com",
        phone: "+1-555-987-6543",
      },
    ],
    portfolio: [
      {
        id: "port-1",
        title: "Personal Portfolio Website",
        description: "A responsive portfolio website showcasing projects and skills.",
        url: "https://example.com/portfolio",
        type: "website",
      },
    ],
    templateId: "modern-clean",
    careerStage: "working-professional",
    claims: [],
  };
}

/** A fully empty resume (all sections blank). */
export function createEmptyResume(): Resume {
  return {
    name: "",
    title: "",
    email: "",
    phone: "",
    address: "",
    nationality: "",
    pronouns: "",
    summary: "",
    social: {
      linkedin: "",
      github: "",
      website: "",
      twitter: "",
      portfolio: "",
      stackoverflow: "",
    },
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
  };
}

/** A large, realistic career graph (many roles / skills / projects). */
export function createLargeResume(
  roleCount: number = 10,
  skillCount: number = 25,
  projectCount: number = 6,
): Resume {
  const base = createEmptyResume();
  base.name = "Ada Lovelace";
  base.title = "Principal Engineer";
  base.email = "ada@example.com";
  base.summary = "Distinguished engineer with deep platform experience.";

  base.experience = Array.from({ length: roleCount }, (_, i) => ({
    id: `exp-${i}`,
    company: `Company ${i}`,
    position: i === 0 ? "Principal Engineer" : `Engineer ${i}`,
    location: "Remote",
    employmentType: "Full-time" as const,
    industry: "Technology",
    startDate: `${2008 + i}-01-01`,
    endDate: i === 0 ? "" : `${2016 + i}-12-31`,
    current: i === 0,
    duration: "",
    description: "Led impactful engineering initiatives.",
    achievements: "Drove measurable outcomes.",
    techUsed: Array.from({ length: Math.min(6, skillCount) }, (_, s) => `Skill ${s}`).join(", "),
    bulletPoints: ["Delivered high-impact results.", "Scaled team processes."],
  }));

  base.skills = Array.from({ length: skillCount }, (_, i) => ({
    id: `skill-${i}`,
    name: `Skill ${i}`,
    level: (i % 2 === 0 ? "Advanced" : "Intermediate") as "Advanced" | "Intermediate",
    category: i % 3 === 0 ? "Programming Languages" : "Frameworks",
    years: `${(i % 10) + 1}`,
  }));

  base.projects = Array.from({ length: projectCount }, (_, i) => ({
    id: `proj-${i}`,
    name: `Project ${i}`,
    description: `Project description ${i}`,
    tech: "Skill 0, Skill 1",
    link: "",
    startDate: "",
    endDate: "",
    role: "",
    teamSize: "",
    status: "Completed" as const,
    bulletPoints: [],
  }));

  return base;
}

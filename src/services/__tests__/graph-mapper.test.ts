"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import { resumeToGraph, graphToResume } from "../graph-mapper";
import type { Resume } from "@/types/resume"; // Adjust path as needed

/**
 * Helper: Create a minimal resume for testing.
 * This replicates a typical "working professional" resume.
 */
function createMinimalResume(name: string = "Test User"): Resume {
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
      {
        id: "skill-1",
        name: "JavaScript",
        level: "Advanced",
        category: "Programming Languages",
        years: "4",
      },
      {
        id: "skill-2",
        name: "TypeScript",
        level: "Intermediate",
        category: "Programming Languages",
        years: "2",
      },
      {
        id: "skill-3",
        name: "React",
        level: "Advanced",
        category: "Frameworks",
        years: "3",
      },
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
      {
        id: "lang-1",
        name: "English",
        proficiency: "Native",
      },
      {
        id: "lang-2",
        name: "Spanish",
        proficiency: "Conversational",
      },
    ],
    interests: [
      {
        id: "int-1",
        name: "Open Source Contributions",
      },
    ],
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
  };
}

/** ------------------------------
 * GraphMapper Tests
 * -------------------------------
 */

describe("GraphMapper", () => {
  let testResume: Resume;

  beforeEach(() => {
    testResume = createMinimalResume();
  });

  // -----------------------
  // 1. resumeToGraph basic functionality
  // -----------------------
  it("resumeToGraph should convert a resume to a KnowledgeGraph with nodes and edges", () => {
    const graph = resumeToGraph(testResume);

    expect(graph).toBeDefined();
    expect(graph.profile).toBeDefined();
    expect(graph.profile.type).toBe("profile");
    expect(graph.nodes).toBeInstanceOf(Array);
    expect(graph.edges).toBeInstanceOf(Array);

    // Verify core nodes exist
    const profile = graph.profile;
    expect(profile.label).toBe("Test User");
    expect(profile.title).toBe("Developer");
    expect(profile.email).toBe("test@example.com");

    // Check that data was preserved in graph nodes
    // Note: techUsed creates additional skills beyond resume.skills (React, TypeScript, Node.js)
    // The mapper does NOT currently deduplicate across resume.skills and techUsed paths
    const skills = graph.nodes.filter(n => n.type === "skill");
    expect(skills.length).toBeGreaterThanOrEqual(3);
    expect(skills.map(s => s.label)).toContain("JavaScript");
    expect(skills.map(s => s.label)).toContain("TypeScript");
    expect(skills.map(s => s.label)).toContain("React");

    const organizations = graph.nodes.filter(n => n.type === "organization");
    // Only named companies/universities become OrganizationNodes; social links are not affected
    expect(organizations.length).toBeGreaterThanOrEqual(1);

    const roles = graph.nodes.filter(n => n.type === "role");
    expect(roles).toHaveLength(1);
    expect(roles[0].title).toBe("Senior Developer");

    // Check edges
    const hasSkillEdges = graph.edges.some(e => e.type === "HAS_SKILL");
    expect(hasSkillEdges).toBe(true);
    const hasRoleEdges = graph.edges.some(e => e.type === "HAS_ROLE");
    expect(hasRoleEdges).toBe(true);
    const hasWorkedAtEdges = graph.edges.some(e => e.type === "WORKED_AT");
    expect(hasWorkedAtEdges).toBe(true);
  });

  // --------------------
  // 2. resumeToGraph empty resume
  // --------------------
  it("resumeToGraph should handle an empty resume (minimal data)", () => {
    const emptyResume: Resume = {
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
    };

    const graph = resumeToGraph(emptyResume);

    expect(graph).toBeDefined();
    expect(graph.profile).toBeDefined();
    expect(graph.nodes).toHaveLength(1); // Only the profile node
    expect(graph.edges).toHaveLength(0);
  });

  // --------------------
  // 3. graphToResume basic functionality
  // --------------------
  it("graphToResume should convert a complete KnowledgeGraph back to a Resume", () => {
    const graph = resumeToGraph(testResume);
    const roundedResume = graphToResume(graph);

    expect(roundedResume).toBeDefined();
    expect(roundedResume.name).toBe(testResume.name);
    expect(roundedResume.title).toBe(testResume.title);
    expect(roundedResume.email).toBe(testResume.email);
    expect(roundedResume.phone).toBe(testResume.phone);
    expect(roundedResume.summary).toBe(testResume.summary);

    // Verify data integrity after roundtrip
    expect(roundedResume.experience).toHaveLength(1);
    expect(roundedResume.experience[0].company).toBe("Tech Corp");
    expect(roundedResume.experience[0].position).toBe("Senior Developer");

    expect(roundedResume.education).toHaveLength(1);
    expect(roundedResume.education[0].school).toBe("University of Technology");
    expect(roundedResume.education[0].degree).toBe("Bachelor of Science");

    expect(roundedResume.skills).toHaveLength(3);
    expect(roundedResume.skills.map(s => s.name)).toContain("JavaScript");

    expect(roundedResume.projects).toHaveLength(1);
    expect(roundedResume.projects[0].name).toBe("E-commerce Platform");

    expect(roundedResume.certifications).toHaveLength(1);
    expect(roundedResume.certifications[0].name).toBe("AWS Certified Solutions Architect");

    expect(roundedResume.languages).toHaveLength(2);
    expect(roundedResume.languages.map(l => l.name)).toContain("English");

    expect(roundedResume.interests).toHaveLength(1);

    expect(roundedResume.achievements).toHaveLength(1);
    expect(roundedResume.achievements[0].title).toBe("Employee of the Year");

    expect(roundedResume.references).toHaveLength(1);
    expect(roundedResume.references[0].name).toBe("Mary Johnson");

    expect(roundedResume.portfolio).toHaveLength(1);
    expect(roundedResume.portfolio[0].title).toBe("Personal Portfolio Website");
  });

  // ---------------------
  // 4. roundtrip conversion: Resume → Graph → Resume
  // ---------------------
  it("graphToResume after resumeToGraph should preserve all essential data", () => {
    const originalResume = createMinimalResume("Alice Smith");

    const graph = resumeToGraph(originalResume);
    const reconstructedResume = graphToResume(graph);

    // Assert key fields match
    expect(reconstructedResume.name).toBe(originalResume.name);
    expect(reconstructedResume.email).toBe(originalResume.email);
    expect(reconstructedResume.phone).toBe(originalResume.phone);

    // Assert structural data was preserved (not null)
    expect(reconstructedResume.experience).toHaveLength(originalResume.experience.length);
    expect(reconstructedResume.education).toHaveLength(originalResume.education.length);
    expect(reconstructedResume.skills).toHaveLength(originalResume.skills.length);
    expect(reconstructedResume.projects).toHaveLength(originalResume.projects.length);
    expect(reconstructedResume.certifications).toHaveLength(originalResume.certifications.length);
    expect(reconstructedResume.languages).toHaveLength(originalResume.languages.length);
    expect(reconstructedResume.interests).toHaveLength(originalResume.interests.length);
    expect(reconstructedResume.achievements).toHaveLength(originalResume.achievements.length);
    expect(reconstructedResume.references).toHaveLength(originalResume.references.length);
    expect(reconstructedResume.portfolio).toHaveLength(originalResume.portfolio.length);

    // Note: Some fields like social.profile links may be aggregated differently;
    // in particular, GitHub and LinkedIn may not be exported back as separate org nodes.
    // The key property here is resilience of data mapping and ability to survive a roundtrip.
  });

  // ---------------------
  // 5. Empty resume roundtrip
  // ---------------------
  it("empty resume through GraphMapper should produce valid (non-null) outputs", () => {
    const emptyResume: Resume = {
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
    };

    const graph = resumeToGraph(emptyResume);
    const reconstructed = graphToResume(graph);

    expect(graph.nodes).toHaveLength(1); // Only profile
    expect(graph.edges).toHaveLength(0);
    expect(reconstructed.name).toBe("");
    expect(reconstructed.experience).toHaveLength(0);
    expect(reconstructed.education).toHaveLength(0);
    expect(reconstructed.skills).toHaveLength(0);
    expect(reconstructed.projects).toHaveLength(0);
  });

  // ---------------------
  // 6. Skills from resume.skills should be correctly mapped to nodes
  // ---------------------
  it("resumeToGraph should create skill nodes for resume.skills and techUsed", () => {
    const resumeWithTech = createMinimalResume("Tech Test");

    const graph = resumeToGraph(resumeWithTech);

    // The skills from resume.skills (3) + skills from techUsed (3: React, TypeScript, Node.js) = 6
    // The skill dedupe currently only works within the techUsed path, not across resume.skills
    const skills = graph.nodes.filter(n => n.type === "skill");
    expect(skills.length).toBeGreaterThanOrEqual(3);
    expect(skills.some(s => s.label === "JavaScript")).toBe(true);
    expect(skills.some(s => s.label === "TypeScript")).toBe(true);

    const hasSkillEdges = graph.edges.filter(e => e.type === "HAS_SKILL");
    expect(hasSkillEdges).toHaveLength(3); // 3 from resume.skills

    const usedSkillEdges = graph.edges.filter(e => e.type === "USED_SKILL");
    expect(usedSkillEdges).toHaveLength(3); // 3 from techUsed
  });

  // ---------------------
  // 7. Graph consistency validation — all edges reference existing nodes
  // ---------------------
  it("Graph structure should be consistent: edges reference existing nodes", () => {
    const resume = createMinimalResume();
    const graph = resumeToGraph(resume);

    // Ensure all edge source and target nodes exist in the graph
    const nodeIds = new Set(graph.nodes.map(n => n.id));

    graph.edges.forEach(edge => {
      expect(nodeIds.has(edge.sourceNodeId)).toBe(true);
      expect(nodeIds.has(edge.targetNodeId)).toBe(true);
    });

    // Special case: profile should exist
    expect(nodeIds.has(graph.profile.id)).toBe(true);

    // Role, skill, org edges should point to valid roles/skills/orgs
    const roleNodeIds = graph.nodes.filter(n => n.type === "role").map(n => n.id);
    const skillNodeIds = graph.nodes.filter(n => n.type === "skill").map(n => n.id);
    const orgNodeIds = graph.nodes.filter(n => n.type === "organization").map(n => n.id);

    graph.edges.forEach(edge => {
      if (edge.type === "HAS_SKILL") {
        expect(edge.sourceNodeId).toBe(graph.profile.id);
        expect(skillNodeIds).toContain(edge.targetNodeId);
      }
      if (edge.type === "WORKED_AT") {
        expect(roleNodeIds).toContain(edge.sourceNodeId);
        expect(orgNodeIds).toContain(edge.targetNodeId);
      }
    });
  });

  // ---------------------
  // 8. Round-trip preserves careerStage
  // ---------------------
  it("Round-trip Resume → Graph → Resume preserves careerStage", () => {
    const resume = createMinimalResume();

    const graph = resumeToGraph(resume);
    const reconstructed = graphToResume(graph);

    expect(reconstructed.careerStage).toBe(resume.careerStage);
    expect(reconstructed.careerStage).toBe("working-professional");
  });

  // ---------------------
  // 9. Verify profile node has correct type after resumeToGraph
  // ---------------------
  it("Profile should have type='profile' after resumeToGraph", () => {
    const resume = createMinimalResume();
    const graph = resumeToGraph(resume);
    expect(graph.profile.type).toBe("profile");
  });
})
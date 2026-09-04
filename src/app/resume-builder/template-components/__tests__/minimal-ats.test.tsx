"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { MinimalAtsPreview } from "../minimal-ats";
import type { Resume } from "@/types/resume";

const mockResume: Resume = {
  resumeId: "1",
  resumeName: "Test Resume",
  name: "Arvind Chauhan",
  title: "Senior Data Engineer",
  email: "carvind35@gmail.com",
  phone: "9226232697",
  address: "Mumbai, India",
  nationality: "Indian",
  pronouns: "he/him",
  summary: "Experienced data engineer specializing in Python, SQL, and distributed systems.",
  social: {
    linkedin: "linkedin.com/in/arvind-chauhan-bb3a75148",
    github: "github.com/arvind-data-engineer",
    website: "",
    twitter: "",
    portfolio: "",
    stackoverflow: "",
  },
  experience: [
    {
      id: "exp-1",
      company: "Usher Technologies",
      position: "AI/ML Engineer",
      location: "Mumbai",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "Apr 2024",
      endDate: "Present",
      current: true,
      duration: "Apr 2024 – Present",
      description: "Develop and deploy AI/ML models for predicting demand, churn and fraud.",
      achievements: "Improved model accuracy by 15%",
      techUsed: "Python, PyTorch, Scikit-Learn",
      bulletPoints: ["Developed transformer-based models", "Optimized inference pipelines"],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Mumbai",
      degree: "B.E.",
      field: "Computer Engineering",
      year: "2018 – 2022",
      gpa: "3.8",
      minor: "",
      honors: "Dean's List",
      activities: "Coding Club",
      location: "Mumbai",
    },
  ],
  skills: [
    { id: "s-1", name: "Python", level: "Expert", category: "Languages", years: "5" },
    { id: "s-2", name: "SQL", level: "Expert", category: "Languages", years: "5" },
    { id: "s-3", name: "Apache Spark", level: "Advanced", category: "Big Data", years: "3" },
  ],
  projects: [
    {
      id: "p-1",
      name: "Data Pipeline Platform",
      description: "Real-time streaming platform handling millions of events daily.",
      tech: "Kafka, Spark, Python",
      link: "github.com/arvind/pipeline",
      startDate: "2023",
      endDate: "2023",
      role: "Lead Engineer",
      teamSize: "3",
      status: "Completed",
      bulletPoints: ["Reduced latency by 40%"],
    },
  ],
  certifications: [
    {
      id: "c-1",
      name: "AWS Certified Data Analytics",
      issuer: "Amazon Web Services",
      date: "2023",
      link: "",
      description: "",
      expiryDate: "",
      skills: "AWS, Spark",
    },
  ],
  languages: [
    { id: "l-1", name: "English", proficiency: "Native" },
  ],
  interests: [{ id: "i-1", name: "Open Source" }],
  achievements: [
    { id: "a-1", title: "Hackathon Winner", description: "Won 1st place in national AI hackathon", date: "2022", issuer: "TechCorp" },
  ],
  references: [],
  portfolio: [],
  templateId: "minimal-ats",
  careerStage: "working-professional",
  claims: [],
};

describe("MinimalAtsPreview", () => {
  it("renders personal details, summary, experience, education, projects, skills, and certifications correctly", () => {
    const html = renderToString(<MinimalAtsPreview resume={mockResume} />);

    expect(html).toContain("Arvind Chauhan");
    expect(html).toContain("Senior Data Engineer");
    expect(html).toContain("carvind35@gmail.com");
    expect(html).toContain("Mumbai, India");
    expect(html).toContain("Usher Technologies");
    expect(html).toContain("AI/ML Engineer");
    expect(html).toContain("Developed transformer-based models");
    expect(html).toContain("University of Mumbai");
    expect(html).toContain("Data Pipeline Platform");
    expect(html).toContain("Python");
    expect(html).toContain("AWS Certified Data Analytics");
    expect(html).toContain("Hackathon Winner");
  });
});

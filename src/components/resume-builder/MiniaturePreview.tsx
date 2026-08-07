"use client";

import { useEffect, useRef, useState } from "react";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import type { Resume } from "@/types/resume";

// A4 at 96 dpi
const RESUME_WIDTH = 794;

const SAMPLE_RESUME: Resume = {
  name: "Alex Johnson",
  title: "Senior Software Engineer",
  email: "alex@example.com",
  phone: "+1 (555) 012-3456",
  address: "San Francisco, CA",
  nationality: "",
  pronouns: "",
  summary:
    "Experienced engineer with 8 years building scalable web applications and distributed systems. Passionate about clean architecture and developer experience.",
  social: {
    linkedin: "linkedin.com/in/alex",
    github: "github.com/alex",
    website: "alexjohnson.dev",
    twitter: "",
    portfolio: "",
    stackoverflow: "",
  },
  experience: [
    {
      id: "e1",
      company: "Acme Corp",
      position: "Senior Software Engineer",
      location: "San Francisco, CA",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "2020-01",
      endDate: "",
      current: true,
      duration: "4 yrs",
      description: "Led architecture of microservices platform serving 2M users.",
      achievements: "Reduced latency by 40%, improved deployment frequency 3×.",
      techUsed: "TypeScript, React, Node.js, PostgreSQL",
      bulletPoints: [
        "Architected microservices platform serving 2M daily active users",
        "Reduced API latency by 40% through caching strategy redesign",
        "Mentored team of 5 engineers, improving delivery velocity by 30%",
      ],
    },
    {
      id: "e2",
      company: "StartupXYZ",
      position: "Software Engineer",
      location: "Remote",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "2018-03",
      endDate: "2019-12",
      current: false,
      duration: "1 yr 9 mos",
      description: "Built real-time collaboration features for SaaS product.",
      achievements: "Launched product used by 50k users within 6 months.",
      techUsed: "React, Node.js, Redis, WebSockets",
      bulletPoints: [
        "Built real-time collaboration features using WebSockets",
        "Launched v2 product adopted by 50k users in 6 months",
      ],
    },
  ],
  education: [
    {
      id: "ed1",
      school: "University of California",
      degree: "B.S. Computer Science",
      year: "2018",
      field: "Computer Science",
      gpa: "3.8",
      minor: "Mathematics",
      honors: "Magna Cum Laude",
      activities: "ACM Club, Hackathon organizer",
      location: "Berkeley, CA",
    },
  ],
  skills: [
    { id: "s1", name: "TypeScript", level: "Expert", category: "Languages", years: "6" },
    { id: "s2", name: "React", level: "Expert", category: "Frontend", years: "6" },
    { id: "s3", name: "Node.js", level: "Advanced", category: "Backend", years: "5" },
    { id: "s4", name: "PostgreSQL", level: "Advanced", category: "Database", years: "4" },
    { id: "s5", name: "AWS", level: "Intermediate", category: "Cloud", years: "3" },
    { id: "s6", name: "Docker", level: "Advanced", category: "DevOps", years: "4" },
  ],
  projects: [
    {
      id: "p1",
      name: "OpenPlatform",
      description: "Open-source developer platform with 2k GitHub stars.",
      tech: "TypeScript, React, Node.js",
      link: "github.com/alex/openplatform",
      startDate: "2022-06",
      endDate: "2023-01",
      role: "Maintainer",
      teamSize: "3",
      status: "Completed",
      bulletPoints: [
        "2k GitHub stars — used by 500+ developers",
        "Built plugin system supporting 30+ community extensions",
      ],
    },
  ],
  certifications: [
    {
      id: "c1",
      name: "AWS Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2022-05",
      link: "",
      description: "",
      expiryDate: "2025-05",
      skills: "AWS, Cloud Architecture",
    },
  ],
  languages: [
    { id: "l1", name: "English", proficiency: "Native" },
    { id: "l2", name: "Spanish", proficiency: "Conversational" },
  ],
  interests: [],
  achievements: [],
  references: [],
  portfolio: [],
  templateId: "modern-clean",
  careerStage: "working-professional",
  claims: [],
};

export function MiniaturePreview({ templateId }: { templateId: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0.25);

  // Lazy render — only when card enters the viewport
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "150px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Recompute scale whenever the card resizes (responsive grid)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / RESUME_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const resume: Resume = { ...SAMPLE_RESUME, templateId };

  return (
    <div
      ref={wrapperRef}
      className="w-full aspect-[3/4] overflow-hidden rounded-lg bg-white relative"
    >
      {visible ? (
        <div
          aria-hidden="true"
          style={{
            width: RESUME_WIDTH,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <ResumePreview resume={resume} template={template} />
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />
      )}
    </div>
  );
}

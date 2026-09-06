import { describe, it, expect } from "vitest";
import {
  mapProfileToResume,
  mapResumeToProfile,
  calculateProfileCompleteness,
  isEmptyResumePayload,
  type ProfileData,
} from "@/lib/resume-seeding";

// ── Helper: minimal base resume ──

function makeBaseResume() {
  return {
    name: "",
    title: "",
    email: "",
    phone: "",
    address: "",
    nationality: "",
    pronouns: "",
    summary: "",
    social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    portfolio: [],
    templateId: "modern-clean",
    careerStage: "working-professional",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// mapProfileToResume
// ══════════════════════════════════════════════════════════════════════════════

describe("mapProfileToResume", () => {
  it("returns base unchanged when profileData is null", () => {
    const base = makeBaseResume();
    const result = mapProfileToResume(base, null);
    expect(result).toEqual(base);
  });

  it("returns base unchanged when profileData is undefined", () => {
    const base = makeBaseResume();
    const result = mapProfileToResume(base, undefined);
    expect(result).toEqual(base);
  });

  it("maps basic fields correctly", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      fullName: "Jane Smith",
      headline: "Software Engineer",
      summary: "Experienced engineer",
      email: "jane@example.com",
      phone: "+1 555 1234",
      location: "San Francisco",
      nationality: "American",
      pronouns: "she/her",
    };

    const result = mapProfileToResume(base, profile);
    expect(result.name).toBe("Jane Smith");
    expect(result.title).toBe("Software Engineer");
    expect(result.summary).toBe("Experienced engineer");
    expect(result.email).toBe("jane@example.com");
    expect(result.phone).toBe("+1 555 1234");
    expect(result.address).toBe("San Francisco");
    expect(result.nationality).toBe("American");
    expect(result.pronouns).toBe("she/her");
  });

  it("maps social links correctly", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      linkedin: "https://linkedin.com/in/jane",
      github: "https://github.com/jane",
      website: "https://jane.dev",
      twitter: "https://x.com/jane",
      portfolioUrl: "https://jane.design",
      stackoverflow: "https://stackoverflow.com/users/jane",
    };

    const result = mapProfileToResume(base, profile);
    expect(result.social.linkedin).toBe("https://linkedin.com/in/jane");
    expect(result.social.github).toBe("https://github.com/jane");
    expect(result.social.website).toBe("https://jane.dev");
    expect(result.social.twitter).toBe("https://x.com/jane");
    expect(result.social.portfolio).toBe("https://jane.design");
    expect(result.social.stackoverflow).toBe("https://stackoverflow.com/users/jane");
  });

  it("maps experience with all fields", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      experience: [
        {
          company: "Acme",
          position: "Engineer",
          location: "NYC",
          employmentType: "Full-time",
          industry: "Tech",
          startDate: "2020",
          endDate: "2024",
          current: false,
          duration: "4 years",
          description: "Built things",
          achievements: "Shipped product",
          techUsed: "React, Node",
          bulletPoints: ["Did thing 1", "Did thing 2"],
        },
      ],
    };

    const result = mapProfileToResume(base, profile) as any;
    expect(result.experience).toHaveLength(1);
    expect(result.experience[0].company).toBe("Acme");
    expect(result.experience[0].position).toBe("Engineer");
    expect(result.experience[0].location).toBe("NYC");
    expect(result.experience[0].employmentType).toBe("Full-time");
    expect(result.experience[0].industry).toBe("Tech");
    expect(result.experience[0].startDate).toBe("2020");
    expect(result.experience[0].endDate).toBe("2024");
    expect(result.experience[0].current).toBe(false);
    expect(result.experience[0].duration).toBe("4 years");
    expect(result.experience[0].description).toBe("Built things");
    expect(result.experience[0].achievements).toBe("Shipped product");
    expect(result.experience[0].techUsed).toBe("React, Node");
    expect(result.experience[0].bulletPoints).toEqual(["Did thing 1", "Did thing 2"]);
  });

  it("maps projects correctly", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      projects: [
        {
          name: "Cool App",
          description: "A cool app",
          tech: "React",
          link: "https://cool.app",
          startDate: "2023",
          endDate: "2024",
          role: "Lead",
          teamSize: "5",
          status: "Completed",
          bulletPoints: ["Built frontend"],
        },
      ],
    };

    const result = mapProfileToResume(base, profile) as any;
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe("Cool App");
    expect(result.projects[0].tech).toBe("React");
    expect(result.projects[0].status).toBe("Completed");
  });

  it("maps certifications correctly", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      certifications: [
        {
          name: "AWS Solutions Architect",
          issuer: "Amazon",
          date: "2023",
          link: "https://aws.com/cert",
          description: "Cloud certification",
          expiryDate: "2026",
          skills: "AWS, Cloud",
        },
      ],
    };

    const result = mapProfileToResume(base, profile) as any;
    expect(result.certifications).toHaveLength(1);
    expect(result.certifications[0].name).toBe("AWS Solutions Architect");
    expect(result.certifications[0].issuer).toBe("Amazon");
  });

  it("maps languages correctly", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      languages: [
        { name: "English", proficiency: "Native" },
        { name: "Spanish", proficiency: "Fluent" },
      ],
    };

    const result = mapProfileToResume(base, profile) as any;
    expect(result.languages).toHaveLength(2);
    expect(result.languages[0].name).toBe("English");
    expect(result.languages[0].proficiency).toBe("Native");
  });

  it("maps achievements correctly", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      achievements: [
        { title: "Employee of the Year", description: "Top performer", date: "2023", issuer: "Acme" },
      ],
    };

    const result = mapProfileToResume(base, profile) as any;
    expect(result.achievements).toHaveLength(1);
    expect(result.achievements[0].title).toBe("Employee of the Year");
  });

  it("maps portfolio correctly", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      portfolio: [
        { title: "My Portfolio", description: "Design work", url: "https://portfolio.dev", type: "website" },
      ],
    };

    const result = mapProfileToResume(base, profile) as any;
    expect(result.portfolio).toHaveLength(1);
    expect(result.portfolio[0].title).toBe("My Portfolio");
    expect(result.portfolio[0].type).toBe("website");
  });

  it("handles skills as string array", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      skills: ["React", "TypeScript", "Node.js"],
    };

    const result = mapProfileToResume(base, profile) as any;
    expect(result.skills).toHaveLength(3);
    expect(result.skills[0].name).toBe("React");
    expect(result.skills[1].name).toBe("TypeScript");
    expect(result.skills[2].name).toBe("Node.js");
  });

  it("handles skills as object array", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      skills: [
        { name: "React", level: "Expert", category: "Frontend", years: "5" },
        { name: "Node.js", level: "Advanced" },
      ],
    };

    const result = mapProfileToResume(base, profile);
    expect(result.skills).toHaveLength(2);
    const s0 = result.skills[0] as any;
    const s1 = result.skills[1] as any;
    expect(s0.name).toBe("React");
    expect(s0.level).toBe("Expert");
    expect(s0.category).toBe("Frontend");
    expect(s0.years).toBe("5");
    expect(s1.name).toBe("Node.js");
    expect(s1.level).toBe("Advanced");
  });

  it("preserves base values when profile fields are empty", () => {
    const base = makeBaseResume();
    base.name = "Existing Name";
    base.email = "existing@example.com";
    base.summary = "Existing summary";

    const profile: ProfileData = {
      fullName: "",
      email: "",
      summary: "",
    };

    const result = mapProfileToResume(base, profile);
    expect(result.name).toBe("Existing Name");
    expect(result.email).toBe("existing@example.com");
    expect(result.summary).toBe("Existing summary");
  });

  it("does not mutate the base resume", () => {
    const base = makeBaseResume();
    const profile: ProfileData = {
      fullName: "Jane",
      experience: [{ company: "Acme", position: "Engineer" }],
    };

    const result = mapProfileToResume(base, profile);
    expect(base.name).toBe("");
    expect(base.experience).toHaveLength(0);
    expect(result.name).toBe("Jane");
    expect(result.experience).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// mapResumeToProfile
// ══════════════════════════════════════════════════════════════════════════════

describe("mapResumeToProfile", () => {
  it("returns empty object for null/undefined input", () => {
    expect(mapResumeToProfile(null as any)).toEqual({});
    expect(mapResumeToProfile(undefined as any)).toEqual({});
  });

  it("maps basic fields correctly", () => {
    const resume = {
      name: "Jane Smith",
      title: "Software Engineer",
      email: "jane@example.com",
      phone: "+1 555 1234",
      address: "San Francisco",
      nationality: "American",
      pronouns: "she/her",
      summary: "Experienced engineer",
    };

    const result = mapResumeToProfile(resume);
    expect(result.fullName).toBe("Jane Smith");
    expect(result.headline).toBe("Software Engineer");
    expect(result.email).toBe("jane@example.com");
    expect(result.phone).toBe("+1 555 1234");
    expect(result.location).toBe("San Francisco");
    expect(result.nationality).toBe("American");
    expect(result.pronouns).toBe("she/her");
    expect(result.summary).toBe("Experienced engineer");
  });

  it("maps social links correctly", () => {
    const resume = {
      social: {
        linkedin: "https://linkedin.com/in/jane",
        github: "https://github.com/jane",
        website: "https://jane.dev",
        twitter: "https://x.com/jane",
        portfolio: "https://jane.design",
        stackoverflow: "https://stackoverflow.com/users/jane",
      },
    };

    const result = mapResumeToProfile(resume);
    expect(result.linkedin).toBe("https://linkedin.com/in/jane");
    expect(result.github).toBe("https://github.com/jane");
    expect(result.website).toBe("https://jane.dev");
    expect(result.twitter).toBe("https://x.com/jane");
    expect(result.portfolioUrl).toBe("https://jane.design");
    expect(result.stackoverflow).toBe("https://stackoverflow.com/users/jane");
  });

  it("maps experience and strips IDs", () => {
    const resume = {
      experience: [
        {
          id: "exp_123",
          company: "Acme",
          position: "Engineer",
          location: "NYC",
          bulletPoints: ["Did thing"],
        },
      ],
    };

    const result = mapResumeToProfile(resume);
    expect(result.experience).toHaveLength(1);
    expect(result.experience![0].company).toBe("Acme");
    expect(result.experience![0].position).toBe("Engineer");
    expect(result.experience![0].location).toBe("NYC");
    expect(result.experience![0].bulletPoints).toEqual(["Did thing"]);
    expect(result.experience![0]).not.toHaveProperty("id");
  });

  it("maps projects and strips IDs", () => {
    const resume = {
      projects: [
        {
          id: "proj_123",
          name: "Cool App",
          tech: "React",
          status: "Completed",
        },
      ],
    };

    const result = mapResumeToProfile(resume);
    expect(result.projects).toHaveLength(1);
    expect(result.projects![0].name).toBe("Cool App");
    expect(result.projects![0]).not.toHaveProperty("id");
  });

  it("maps skills and strips IDs", () => {
    const resume = {
      skills: [
        { id: "skill_123", name: "React", level: "Expert", category: "Frontend", years: "5" },
      ],
    };

    const result = mapResumeToProfile(resume);
    expect(result.skills).toHaveLength(1);
    expect(result.skills![0]).toEqual({ name: "React", level: "Expert", category: "Frontend", years: "5" });
    expect(result.skills![0]).not.toHaveProperty("id");
  });

  it("omits empty/missing arrays (does not return empty arrays)", () => {
    const resume = { name: "Jane" };
    const result = mapResumeToProfile(resume);
    // Empty arrays should be omitted, not included as []
    expect(result.experience).toBeUndefined();
    expect(result.education).toBeUndefined();
    expect(result.projects).toBeUndefined();
    expect(result.certifications).toBeUndefined();
    expect(result.languages).toBeUndefined();
    expect(result.achievements).toBeUndefined();
    expect(result.portfolio).toBeUndefined();
  });

  it("omits empty string fields (does not return empty strings)", () => {
    const resume = { name: "", title: "", email: "  ", phone: null };
    const result = mapResumeToProfile(resume);
    expect(result.fullName).toBeUndefined();
    expect(result.headline).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });

  it("only includes populated fields", () => {
    const resume = {
      name: "Jane",
      email: "jane@example.com",
      // no other fields
    };
    const result = mapResumeToProfile(resume);
    expect(Object.keys(result)).toEqual(["fullName", "email"]);
  });

  it("omits experience items with no company or position", () => {
    const resume = {
      experience: [
        { company: "Acme", position: "Engineer" },
        { company: "", position: "" },
        { description: "Just a description" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.experience).toHaveLength(1);
    expect(result.experience![0].company).toBe("Acme");
  });

  it("omits education items with no school or degree", () => {
    const resume = {
      education: [
        { school: "MIT", degree: "BS" },
        { school: "", degree: "" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.education).toHaveLength(1);
  });

  it("omits projects with no name", () => {
    const resume = {
      projects: [
        { name: "Cool App", tech: "React" },
        { name: "", description: "No name" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.projects).toHaveLength(1);
  });

  it("omits certifications with no name", () => {
    const resume = {
      certifications: [
        { name: "AWS", issuer: "Amazon" },
        { name: "", issuer: "Something" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.certifications).toHaveLength(1);
  });

  it("omits skills with no name", () => {
    const resume = {
      skills: [
        { name: "React", level: "Expert" },
        { name: "", level: "Beginner" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.skills).toHaveLength(1);
  });

  it("omits languages with no name", () => {
    const resume = {
      languages: [
        { name: "English", proficiency: "Native" },
        { name: "", proficiency: "Fluent" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.languages).toHaveLength(1);
  });

  it("omits achievements with no title", () => {
    const resume = {
      achievements: [
        { title: "Award", description: "Top performer" },
        { title: "", description: "Something" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.achievements).toHaveLength(1);
  });

  it("omits portfolio items with no title", () => {
    const resume = {
      portfolio: [
        { title: "My Site", url: "https://example.com" },
        { title: "", url: "https://other.com" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.portfolio).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateProfileCompleteness
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateProfileCompleteness", () => {
  it("returns 0 for null profile", () => {
    const result = calculateProfileCompleteness(null);
    expect(result.overall).toBe(0);
  });

  it("returns 0 for undefined profile", () => {
    const result = calculateProfileCompleteness(undefined);
    expect(result.overall).toBe(0);
  });

  it("returns 0 for empty profile", () => {
    const result = calculateProfileCompleteness({});
    expect(result.overall).toBe(0);
  });

  it("scores basics correctly", () => {
    const result = calculateProfileCompleteness({
      fullName: "Jane",
      headline: "Engineer",
      email: "jane@example.com",
      phone: "+1 555",
      location: "SF",
    });
    expect(result.sections.basics).toBe(100);
  });

  it("scores partial basics", () => {
    const result = calculateProfileCompleteness({
      fullName: "Jane",
      email: "jane@example.com",
    });
    // 2 of 5 fields = 40%
    expect(result.sections.basics).toBe(40);
  });

  it("scores experience correctly", () => {
    const result = calculateProfileCompleteness({
      experience: [{ company: "Acme", position: "Engineer" }],
    });
    expect(result.sections.experience).toBe(70); // has company+position but no bullets
  });

  it("scores experience with bullets", () => {
    const result = calculateProfileCompleteness({
      experience: [{ company: "Acme", position: "Engineer", bulletPoints: ["Did thing"] }],
    });
    expect(result.sections.experience).toBe(100);
  });

  it("scores education correctly", () => {
    const result = calculateProfileCompleteness({
      education: [{ school: "MIT", degree: "BS" }],
    });
    expect(result.sections.education).toBe(100);
  });

  it("scores skills by count", () => {
    expect(calculateProfileCompleteness({ skills: [] }).sections.skills).toBe(0);
    expect(calculateProfileCompleteness({ skills: ["React"] }).sections.skills).toBe(30);
    expect(calculateProfileCompleteness({ skills: ["React", "Node", "TypeScript"] }).sections.skills).toBe(60);
    expect(calculateProfileCompleteness({ skills: ["React", "Node", "TypeScript", "Python", "Go", "Rust"] }).sections.skills).toBe(80);
    expect(calculateProfileCompleteness({ skills: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] }).sections.skills).toBe(100);
  });

  it("scores projects correctly", () => {
    const result = calculateProfileCompleteness({
      projects: [{ name: "Cool App" }],
    });
    expect(result.sections.projects).toBe(100);
  });

  it("scores certifications correctly", () => {
    const result = calculateProfileCompleteness({
      certifications: [{ name: "AWS" }],
    });
    expect(result.sections.certifications).toBe(100);
  });

  it("scores languages correctly", () => {
    const result = calculateProfileCompleteness({
      languages: [{ name: "English" }],
    });
    expect(result.sections.languages).toBe(100);
  });

  it("scores achievements correctly", () => {
    const result = calculateProfileCompleteness({
      achievements: [{ title: "Award" }],
    });
    expect(result.sections.achievements).toBe(100);
  });

  it("calculates weighted overall correctly", () => {
    // Full basics (25%) + full experience (20%) + rest empty
    const result = calculateProfileCompleteness({
      fullName: "Jane",
      headline: "Engineer",
      email: "jane@example.com",
      phone: "+1 555",
      location: "SF",
      experience: [{ company: "Acme", position: "Engineer", bulletPoints: ["thing"] }],
    });
    // basics: 25 * 100/100 = 25, experience: 20 * 100/100 = 20
    // total weight = 100, weighted sum = 45
    expect(result.overall).toBe(45);
  });

  it("handles skills as string array", () => {
    const result = calculateProfileCompleteness({
      skills: ["React", "Node", "TypeScript"],
    });
    expect(result.sections.skills).toBe(60);
  });

  it("handles skills as object array", () => {
    const result = calculateProfileCompleteness({
      skills: [{ name: "React" }, { name: "Node" }],
    });
    expect(result.sections.skills).toBe(30);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// mapResumeToProfile — data preservation / merge behavior
// ══════════════════════════════════════════════════════════════════════════════

describe("mapResumeToProfile — preservation behavior", () => {
  it("returns only fields present in resume (no empty fillers)", () => {
    const resume = { name: "John", email: "john@example.com" };
    const result = mapResumeToProfile(resume);
    // Should only have fullName and email, nothing else
    expect(result).toEqual({ fullName: "John", email: "john@example.com" });
  });

  it("social links only included when present in resume", () => {
    const resumeWithLinkedin = {
      name: "John",
      social: { linkedin: "https://linkedin.com/in/john" },
    };
    const result = mapResumeToProfile(resumeWithLinkedin);
    expect(result.linkedin).toBe("https://linkedin.com/in/john");
    expect(result.github).toBeUndefined();
  });

  it("populated experience array is included", () => {
    const resume = {
      experience: [
        { company: "Acme", position: "Engineer", location: "NYC" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.experience).toHaveLength(1);
    expect(result.experience![0]).toEqual({
      company: "Acme",
      position: "Engineer",
      location: "NYC",
    });
  });

  it("populated skills array is included", () => {
    const resume = {
      skills: [
        { name: "React", level: "Expert" },
        { name: "Node.js", level: "Advanced" },
      ],
    };
    const result = mapResumeToProfile(resume);
    expect(result.skills).toHaveLength(2);
    expect(result.skills![0]).toEqual({ name: "React", level: "Expert" });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ProfileData merge logic (simulates PUT /api/identity merge)
// ══════════════════════════════════════════════════════════════════════════════

describe("profileData merge logic", () => {
  /** Simulates the merge logic from PUT /api/identity */
  function mergeProfileData(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged = { ...existing };
    for (const [key, value] of Object.entries(incoming)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;
      merged[key] = value;
    }
    return merged;
  }

  it("preserves existing fields when incoming is partial", () => {
    const existing = {
      fullName: "John",
      linkedin: "https://linkedin.com/in/john",
      github: "https://github.com/john",
      website: "https://john.dev",
    };
    const incoming = { fullName: "John", email: "john@example.com" };
    const result = mergeProfileData(existing, incoming);
    expect(result.linkedin).toBe("https://linkedin.com/in/john");
    expect(result.github).toBe("https://github.com/john");
    expect(result.website).toBe("https://john.dev");
    expect(result.email).toBe("john@example.com");
  });

  it("preserves existing arrays when incoming omits them", () => {
    const existing = {
      fullName: "John",
      experience: [{ company: "Old Co", position: "Old Role" }],
      projects: [{ name: "Old Project" }],
    };
    const incoming = { fullName: "John" };
    const result = mergeProfileData(existing, incoming);
    expect(result.experience).toEqual([{ company: "Old Co", position: "Old Role" }]);
    expect(result.projects).toEqual([{ name: "Old Project" }]);
  });

  it("populated incoming array replaces existing array", () => {
    const existing = {
      projects: [{ name: "Old Project" }],
    };
    const incoming = {
      projects: [{ name: "New Project", tech: "React" }],
    };
    const result = mergeProfileData(existing, incoming);
    expect(result.projects).toEqual([{ name: "New Project", tech: "React" }]);
  });

  it("empty incoming values do not erase existing values", () => {
    const existing = {
      linkedin: "https://linkedin.com/in/john",
      github: "https://github.com/john",
    };
    const incoming = {
      linkedin: "",
      github: null,
    };
    const result = mergeProfileData(existing, incoming);
    expect(result.linkedin).toBe("https://linkedin.com/in/john");
    expect(result.github).toBe("https://github.com/john");
  });

  it("new fields are added alongside existing fields", () => {
    const existing = { fullName: "John" };
    const incoming = { email: "john@example.com", phone: "+1 555" };
    const result = mergeProfileData(existing, incoming);
    expect(result.fullName).toBe("John");
    expect(result.email).toBe("john@example.com");
    expect(result.phone).toBe("+1 555");
  });

  it("full incoming data replaces existing data", () => {
    const existing = { fullName: "Old Name", linkedin: "old-link" };
    const incoming = { fullName: "New Name", linkedin: "new-link" };
    const result = mergeProfileData(existing, incoming);
    expect(result.fullName).toBe("New Name");
    expect(result.linkedin).toBe("new-link");
  });

  it("handles empty incoming object (no-op merge)", () => {
    const existing = { fullName: "John", linkedin: "link" };
    const incoming = {};
    const result = mergeProfileData(existing, incoming);
    expect(result).toEqual({ fullName: "John", linkedin: "link" });
  });

  it("handles empty existing object (pure addition)", () => {
    const existing = {};
    const incoming = { fullName: "John", email: "john@example.com" };
    const result = mergeProfileData(existing, incoming);
    expect(result).toEqual({ fullName: "John", email: "john@example.com" });
  });

  it("end-to-end: resume with minimal data preserves rich identity", () => {
    const existingIdentity = {
      fullName: "John Doe",
      headline: "Senior Engineer",
      email: "john@example.com",
      phone: "+1 555 1234",
      location: "San Francisco",
      linkedin: "https://linkedin.com/in/john",
      github: "https://github.com/john",
      website: "https://john.dev",
      experience: [
        { company: "Acme", position: "Engineer", description: "Built things" },
        { company: "TechCo", position: "Sr Engineer", description: "Led team" },
      ],
      education: [{ school: "MIT", degree: "BS", field: "CS" }],
      skills: [{ name: "React", level: "Expert" }, { name: "Node.js", level: "Advanced" }],
      projects: [{ name: "Cool App", tech: "React" }],
      certifications: [{ name: "AWS", issuer: "Amazon" }],
      languages: [{ name: "English", proficiency: "Native" }],
      achievements: [{ title: "Award", description: "Top performer" }],
      portfolio: [{ title: "Portfolio", url: "https://portfolio.dev" }],
    };

    // Resume only has name and email
    const resume = { name: "John Doe", email: "john@example.com" };
    const incomingPayload = mapResumeToProfile(resume);

    // Verify incomingPayload only has fullName and email (no empty fillers)
    expect(Object.keys(incomingPayload)).toEqual(["fullName", "email"]);

    // Simulate merge
    const merged = mergeProfileData(existingIdentity, incomingPayload as Record<string, unknown>);

    // ALL existing fields should be preserved
    expect(merged.fullName).toBe("John Doe");
    expect(merged.email).toBe("john@example.com");
    expect(merged.headline).toBe("Senior Engineer");
    expect(merged.phone).toBe("+1 555 1234");
    expect(merged.location).toBe("San Francisco");
    expect(merged.linkedin).toBe("https://linkedin.com/in/john");
    expect(merged.github).toBe("https://github.com/john");
    expect(merged.website).toBe("https://john.dev");
    expect(merged.experience).toHaveLength(2);
    expect(merged.education).toHaveLength(1);
    expect(merged.skills).toHaveLength(2);
    expect(merged.projects).toHaveLength(1);
    expect(merged.certifications).toHaveLength(1);
    expect(merged.languages).toHaveLength(1);
    expect(merged.achievements).toHaveLength(1);
    expect(merged.portfolio).toHaveLength(1);
  });

  it("end-to-end: resume with rich data replaces identity", () => {
    const existingIdentity = {
      fullName: "Old Name",
      linkedin: "old-link",
      experience: [{ company: "Old Co" }],
    };

    const resume = {
      name: "New Name",
      title: "New Title",
      email: "new@example.com",
      social: { linkedin: "new-link", github: "https://github.com/new" },
      experience: [
        { company: "New Co", position: "New Role", location: "NYC" },
        { company: "Another Co", position: "Another Role" },
      ],
      skills: [{ name: "React", level: "Expert" }],
    };
    const incomingPayload = mapResumeToProfile(resume);

    const merged = mergeProfileData(existingIdentity, incomingPayload as Record<string, unknown>);

    expect(merged.fullName).toBe("New Name");
    expect(merged.linkedin).toBe("new-link");
    expect(merged.github).toBe("https://github.com/new");
    const mergedExp = merged.experience as Array<Record<string, unknown>>;
    expect(mergedExp).toHaveLength(2);
    expect(mergedExp[0].company).toBe("New Co");
    const mergedSkills = merged.skills as Array<Record<string, unknown>>;
    expect(mergedSkills).toHaveLength(1);
    // Old fields not in resume should be preserved... but they weren't in incoming
    // so they stay via existing spread
    // experience WAS replaced because incoming has a populated array
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// isEmptyResumePayload
// ══════════════════════════════════════════════════════════════════════════════

describe("isEmptyResumePayload", () => {
  it("returns true for empty payload", () => {
    expect(isEmptyResumePayload({})).toBe(true);
  });

  it("returns false when name is present", () => {
    expect(isEmptyResumePayload({ name: "Jane" })).toBe(false);
  });

  it("returns false when email is present", () => {
    expect(isEmptyResumePayload({ email: "jane@example.com" })).toBe(false);
  });

  it("returns false when experience exists", () => {
    expect(isEmptyResumePayload({ experience: [{}] })).toBe(false);
  });

  it("returns false when skills exist", () => {
    expect(isEmptyResumePayload({ skills: ["React"] })).toBe(false);
  });

  it("returns true for whitespace-only name", () => {
    expect(isEmptyResumePayload({ name: "   " })).toBe(true);
  });
});

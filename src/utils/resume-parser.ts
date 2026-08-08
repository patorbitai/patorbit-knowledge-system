/**
 * Parse raw resume text into the structured Resume format.
 * Uses regex patterns to extract common resume fields.
 */

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  summary?: string;
  experience?: { company: string; position: string; duration: string; location: string; description: string }[];
  education?: { school: string; degree: string; year: string; field: string }[];
  skills?: { name: string; level: string; category: string }[];
  projects?: { name: string; description: string; tech: string }[];
  certifications?: { name: string; issuer: string; date: string }[];
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

const SECTION_HEADERS = [
  /(?:summary|profile|objective|about\s*me)/i,
  /(?:experience|work\s*history|employment|work\s*experience)/i,
  /(?:education|academic|university|college|school)/i,
  /(?:skills|technical\s*skills|core\s*competencies)/i,
  /(?:projects|project)/i,
  /(?:certifications|certificates|licenses)/i,
  /(?:publications|research|awards|honors|languages|interests|references)/i,
];

export function parseRawResumeText(text: string): ParsedResume {
  const lines = text.split("\n").filter(l => l.trim());
  const result: ParsedResume = {};

  // Name: usually first non-empty line
  if (lines.length > 0) {
    const first = lines[0].trim().replace(/^["'\s]+|["'\s]+$/g, "");
    if (!EMAIL_RE.test(first) && !PHONE_RE.test(first) && first.length > 2) {
      result.name = first;
    }
  }

  // Email
  for (const line of lines) {
    const m = line.match(EMAIL_RE);
    if (m) { result.email = m[0]; break; }
  }

  // Phone
  for (const line of lines) {
    const m = line.match(PHONE_RE);
    if (m) { result.phone = m[0]; break; }
  }

  // Split into sections
  const sectionTexts: { name: string; lines: string[]; startLine: number }[] = [];
  let currentSection = "header";
  let currentLines: string[] = [];
  let currentStart = 0;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const isHeader = SECTION_HEADERS.some(re => re.test(trimmed)) && trimmed.length < 50;

    if (isHeader) {
      if (currentLines.length > 0 || sectionTexts.length === 0) {
        sectionTexts.push({ name: currentSection, lines: currentLines, startLine: currentStart });
      }
      currentSection = trimmed;
      currentLines = [];
      currentStart = i;
    } else {
      currentLines.push(line);
    }
  });
  // Push last section
  if (currentLines.length > 0 || currentSection === "header") {
    sectionTexts.push({ name: currentSection, lines: currentLines, startLine: currentStart });
  }

  // Parse each section
  for (const section of sectionTexts) {
    const name = section.name.toLowerCase();
    const body = section.lines.join("\n");

    if (name === "header") {
      result.summary = section.lines.filter(l => {
        const t = l.trim();
        return !EMAIL_RE.test(t) && !PHONE_RE.test(t) && t !== result.name;
      }).join(" ").trim() || undefined;
    }

    if (/experience|work/i.test(name)) {
      result.experience = parseExperienceSection(section.lines);
    }

    if (/education|university|college/i.test(name)) {
      result.education = parseEducationSection(section.lines);
    }

    if (/skills|competenc/i.test(name)) {
      result.skills = parseSkillsSection(body);
    }

    if (/projects/i.test(name)) {
      result.projects = parseProjectsSection(section.lines);
    }

    if (/certifications|certificates/i.test(name)) {
      result.certifications = parseCertificationsSection(section.lines);
    }
  }

  return result;
}

function parseExperienceSection(lines: string[]): ParsedResume["experience"] {
  const items: ParsedResume["experience"] = [];
  let current: any = null;
  const bulletLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect company/position line: "Company Name | Position" or "Position at Company" or "Company - Position"
    const companyMatch = trimmed.match(/^(.+?)(?:\s*[|–—-]\s*)(.+)$/);
    if (companyMatch) {
      if (current) {
        current.description = bulletLines.join("\n");
        items.push(current);
        bulletLines.length = 0;
      }
      current = {
        company: companyMatch[1].trim(),
        position: companyMatch[2].trim(),
        duration: "",
        location: "",
        description: "",
      };
      continue;
    }

    // Or: "Position, Company"
    const positionFirst = trimmed.match(/^(.+?),\s*(.+)$/) && !/^\d/.test(trimmed);
    if (positionFirst && !companyMatch) {
      if (current) {
        current.description = bulletLines.join("\n");
        items.push(current);
        bulletLines.length = 0;
      }
      // Check if next line looks like a company
      current = {
        company: trimmed,
        position: trimmed,
        duration: "",
        location: "",
        description: "",
      };
      continue;
    }

    // Date range
    const dateMatch = trimmed.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Winter|Spring|Summer|Fall)?\s*\d{4})\s*(?:-|–|to)\s*(Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Winter|Spring|Summer|Fall)?\s*\d{4})/i);
    if (dateMatch && current) {
      current.duration = trimmed;
      continue;
    }

    // Location
    if (current && !current.location && /^[A-Z][a-z]+(?:,\s*[A-Z]{2})?$/.test(trimmed)) {
      current.location = trimmed;
      continue;
    }

    // Bullet points
    if (/^[•\-*\d.]/.test(trimmed) || trimmed.startsWith("-") || trimmed.startsWith("*")) {
      bulletLines.push(trimmed);
    } else if (current && trimmed.length > 10) {
      // Continuation of last bullet or description
      bulletLines.push(trimmed);
    }
  }

  if (current) {
    current.description = bulletLines.join("\n");
    items.push(current);
  }

  return items.length > 0 ? items : undefined;
}

function parseEducationSection(lines: string[]): ParsedResume["education"] {
  const items: ParsedResume["education"] = [];
  let current: any = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // School name — often starts the entry
    const schoolMatch = trimmed.match(/^(?:University|College|Institute|School|Academy)\s+of\s+(.+)|^(.+?)\s+(?:University|College|Institute)/i);
    if (schoolMatch && current.school) {
      if (current.school) items.push(current);
      current = { school: trimmed, degree: "", year: "", field: "" };
      continue;
    }

    // Degree pattern: "B.S., B.A., M.S., Ph.D., Bachelor, Master, Associate"
    const degreeMatch = trimmed.match(/(B\.?\s*[ASCE]|M\.?\s*[ASCE]|Ph\.?\s*D|Bachelor|Master|Associate|MBA|Doctorate)/i);
    if (degreeMatch) {
      current.degree = trimmed;
      continue;
    }

    // Year
    const yearMatch = trimmed.match(/(\d{4})\s*(?:-|–)\s*(\d{4}|Present)/) || trimmed.match(/(?:graduated?\s*)?(?:in\s*)?(\d{4})/i);
    if (yearMatch) {
      current.year = trimmed;
      continue;
    }

    // Field of study
    if (trimmed.length > 3 && trimmed.length < 60 && !current.field && !/^\d/.test(trimmed)) {
      current.field = trimmed;
    }
  }

  if (current.school) items.push(current);
  return items.length > 0 ? items : undefined;
}

function parseSkillsSection(body: string): ParsedResume["skills"] {
  const items: ParsedResume["skills"] = [];
  // Split by commas, newlines, bullets, pipes
  const parts = body.split(/[,;•\n|*]+/).map(s => s.trim()).filter(s => s.length > 1);

  for (const part of parts) {
    const clean = part.replace(/^skills|\bskills\b/i, "").trim();
    if (clean && clean.length > 1 && !SECTION_HEADERS.some(re => re.test(clean))) {
      items.push({ name: clean, level: "Intermediate", category: "" });
    }
  }

  return items.length > 0 ? items.slice(0, 30) : undefined;
}

function parseProjectsSection(lines: string[]): ParsedResume["projects"] {
  const items: ParsedResume["projects"] = [];
  let current: any = null;
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^[A-Z][A-Za-z0-9\s]{2,50}$/.test(trimmed) && !/^[•\-*\d.]/.test(trimmed) && trimmed.length < 60) {
      if (current) {
        current.description = bullets.join("\n");
        items.push(current);
        bullets.length = 0;
      }
      current = { name: trimmed, description: "", tech: "" };
      continue;
    }

    if (/^[•\-*\d.]/.test(trimmed)) {
      bullets.push(trimmed);
      // Check for tech mentions
      const techMatch = trimmed.match(/(?:using|with|built\s*(?:with|using)|tech:\s*)(.+)/i);
      if (techMatch && current) current.tech = techMatch[1].trim();
    } else if (current) {
      bullets.push(trimmed);
    }
  }

  if (current) {
    current.description = bullets.join("\n");
    items.push(current);
  }

  return items.length > 0 ? items : undefined;
}

function parseCertificationsSection(lines: string[]): ParsedResume["certifications"] {
  const items: ParsedResume["certifications"] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^[•\-*\d.]/.test(trimmed)) continue;

    const yearMatch = trimmed.match(/(\d{4})/);
    const issuerMatch = trimmed.match(/(?:issued\s*(?:by|from)|by|from|via)\s+(.+)/i);

    items.push({
      name: trimmed.replace(/\(.*?\)/g, "").trim(),
      issuer: issuerMatch?.[1]?.trim() || "",
      date: yearMatch?.[1] || "",
    });
  }

  return items.length > 0 ? items : undefined;
}

/** Assign sequential numeric IDs starting from 1. ResumeSchema requires id: z.number(). */
export function withIds<T extends object>(items: T[] | undefined): (T & { id: number })[] {
  return (items || []).map((item, i) => ({ ...item, id: i + 1 }));
}

export function rawToResume(text: string) {
  const parsed = parseRawResumeText(text);
  return {
    name: parsed.name || "",
    title: "",
    email: parsed.email || "",
    phone: parsed.phone || "",
    address: parsed.address || "",
    nationality: "",
    pronouns: "",
    summary: parsed.summary || "",
    social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    experience: withIds(parsed.experience),
    education: withIds(parsed.education),
    skills: withIds(parsed.skills),
    projects: withIds(parsed.projects),
    certifications: withIds(parsed.certifications),
    languages: [],
    interests: [],
    achievements: [],
    references: [],
    templateId: "modern-clean",
  };
}

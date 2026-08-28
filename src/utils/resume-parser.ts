/**
 * Parse raw resume text into the structured Resume format.
 * Uses regex patterns to extract common resume fields.
 */

export interface ParsedResume {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  summary?: string;
  experience?: { company: string; position: string; duration: string; location: string; description: string }[];
  education?: { school: string; degree: string; year: string; field: string }[];
  skills?: { name: string; level?: string; category: string }[];
  projects?: { name: string; description: string; tech: string }[];
  certifications?: { name: string; issuer: string; date: string }[];
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
/** A trailing date range ("Mar 2020 – Present", "2014 – 2018") on a company line. */
const DATE_RANGE_RE =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Winter|Spring|Summer|Fall)?\s*\d{4})\s*(?:-|–|to)\s*(Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Winter|Spring|Summer|Fall)?\s*\d{4})/i;

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

  const hasExplicitSummarySection = lines.some(l => SECTION_HEADERS[0].test(l.trim()) && l.trim().length < 50) || sectionTexts.some(s => /(?:summary|profile|objective|about\s*me)/i.test(s.name));

  // Parse each section
  for (const section of sectionTexts) {
    const name = section.name.toLowerCase();
    const body = section.lines.join("\n");

    if (name === "header") {
      const headerLines = section.lines.filter(l => {
        const t = l.trim();
        return !EMAIL_RE.test(t) && !PHONE_RE.test(t) && t !== result.name;
      });
      if (hasExplicitSummarySection && headerLines.length > 0) {
        result.title = headerLines[0].trim();
        if (headerLines.length > 1) {
          result.summary = headerLines.slice(1).join(" ").trim();
        }
      } else {
        result.summary = headerLines.join(" ").trim() || undefined;
      }
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
  let current: { company: string; position: string; duration: string; location: string; description: string } | null = null;
  const bulletLines: string[] = [];

  // Broad date patterns as plain strings (not RegExp.source) to avoid
  // double-escaping issues when nested into larger patterns.
  const MN = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const DATE_ATOM = MN + "\\.?\\s+\\d{1,4}|\\d{4}";
  const DATE_ATOM_BROAD = MN + "\\.?\\s+\\d{1,2},?\\s+\\d{4}";
  // A date range: DATE - DATE  (handles en-dash, em-dash, hyphen)
  const DATE_RANGE_PAT = "(" + DATE_ATOM + ")\\s*[-\\u2013\\u2014]\\s*(Present|current|now|ongoing|" + DATE_ATOM + ")";
  // Single date at end of line
  const DATE_SINGLE_PAT = "(" + DATE_ATOM + ")";

  const RE_DATE_RANGE = new RegExp(DATE_RANGE_PAT + "\\s*$", "i");
  const RE_DATE_SINGLE = new RegExp(DATE_SINGLE_PAT + "\\s*$", "i");

  /** Clean trailing punctuation from a name/label. */
  const cleanName = (s: string) => s.replace(/[\s,;:]+$/, "").replace(/^[,;:\s]+/, "").trim();

  /** Clean a company name: strip trailing description text after commas.
   *  "People Tech Group, layers, and reporting" → "People Tech Group"
   *  "PystackJs Pvt. Ltd. (MarsDevs)" → "PystackJs Pvt. Ltd. (MarsDevs)" (kept)
   *  "Google, Mountain View" → "Google" (location stripped)
   */
  const cleanCompanyName = (s: string): string => {
    const t = cleanName(s);
    // Split on commas and keep only parts that look like company text.
    // Known company suffixes and parenthetical names are kept;
    // plain descriptive text ("layers", "and reporting", etc.) is stripped.
    const parts = t.split(/\s*,\s*/);
    if (parts.length <= 1) return t;
    // Keep building from the left: stop at the first part that doesn't
    // look like it belongs to a company name.
    const companySuffix = /\b(?:Inc|LLC|Ltd|Corp|Co\.?|GmbH|Pvt|Limited|Company|Group|Technologies|Tech|Solutions|Services|Systems|Labs|Studio|Consulting|Analytics|Enterprises|Holdings|Ventures|Industries)\b/i;
    const kept: string[] = [];
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;
      // If this part matches known company patterns or looks company-shaped,
      // keep it. Otherwise stop.
      if (companySuffix.test(p) || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(p)) {
        kept.push(p);
      } else if (kept.length > 0 && /^\(.*\)$/.test(p)) {
        // Parenthetical alternative name like "(MarsDevs)" — keep it
        kept.push(p);
      } else {
        break;
      }
    }
    return kept.length > 0 ? kept.join(", ") : t;
  };

  /** Extract any trailing date or date range from a line. */
  const extractDate = (text: string): { date: string; rest: string } => {
    const rm = RE_DATE_RANGE.exec(text);
    if (rm) return { date: rm[0].trim(), rest: cleanName(text.slice(0, rm.index)) };
    const sm = RE_DATE_SINGLE.exec(text);
    if (sm) return { date: sm[0].trim(), rest: cleanName(text.slice(0, sm.index)) };
    return { date: "", rest: text };
  };

  /** Check if a line is a bullet/achievement marker. */
  const isBullet = (t: string) => /^[•·▪◦∙\-*\d.]/.test(t);

  /** Detect a pipe "Company | Position" separator (not hyphens/en-dashes). */
  const PIPE_SEP = /^(.+?)\s*\|\s*(.+)$/;

  /** Check if text looks like a role/position title (not a company). */
  const ROLE_HINTS = /(?:Engineer|Developer|Manager|Director|Lead|Architect|Analyst|Designer|Consultant|Specialist|Coordinator|Supervisor|Officer|Executive|VP|CTO|CEO|CFO|COO|Head|Principal|Senior|Junior|Staff|Associate|Intern|Freelance|Scientist|Researcher|Professor|Teacher|Nurse|Doctor|Technician|Operator)/i;
  const COMPANY_HINTS = /\b(?:Inc|LLC|Ltd|Corp|Co|GmbH|Pvt|Limited|Company|Group|Technologies|Tech|Solutions|Services|Systems|Labs|Studio|Consulting|Analytics|Enterprises|Holdings|Ventures|Industries)\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1) BULLET/ACHIEVEMENT LINES → always description, never a new entry.
    if (isBullet(trimmed) || /^-\s/.test(trimmed)) {
      bulletLines.push(trimmed);
      continue;
    }

    // 2) EXTRACT DATE from the line (handles "2024 – Apr 9", "Apr 2022 – Jan 2024", etc.)
    const { date, rest } = extractDate(trimmed);

    // 3) PIPE SEPARATOR: "Company | Position" or "Position | Company"
    if (rest) {
      const pipeMatch = rest.match(PIPE_SEP);
      if (pipeMatch) {
        if (current) {
          current.description = bulletLines.join("\n");
          items.push(current);
          bulletLines.length = 0;
        }
        const left = pipeMatch[1].trim();
        const right = pipeMatch[2].trim();
        // Determine which side is company vs position using heuristics
        let company = left;
        let position = right;
        if (ROLE_HINTS.test(left) && COMPANY_HINTS.test(right)) {
          company = right;
          position = left;
        } else if (COMPANY_HINTS.test(left) && ROLE_HINTS.test(right)) {
          company = left;
          position = right;
        }
        current = { company, position, duration: date, location: "", description: "" };
        continue;
      }
    }

    // 4) EN-DASH/HYPHEN SEPARATOR: "Company – Position" or "Position – Company"
    //    Only split when both sides look meaningful (not just a date fragment).
    if (rest) {
      const dashMatch = rest.match(/^(.+?)\s+[–—-]\s+(.+)$/);
      if (dashMatch && !/^\d/.test(rest) && dashMatch[1].trim().length > 1 && dashMatch[2].trim().length > 1) {
        const left = dashMatch[1].trim();
        const right = dashMatch[2].trim();
        // Only treat as separator if one side looks like a company and the other like a role
        if (COMPANY_HINTS.test(left) && ROLE_HINTS.test(right)) {
          if (current) {
            current.description = bulletLines.join("\n");
            items.push(current);
            bulletLines.length = 0;
          }
          current = { company: cleanCompanyName(left), position: right, duration: date, location: "", description: "" };
          continue;
        }
        if (ROLE_HINTS.test(left) && COMPANY_HINTS.test(right)) {
          if (current) {
            current.description = bulletLines.join("\n");
            items.push(current);
            bulletLines.length = 0;
          }
          current = { company: cleanCompanyName(right), position: left, duration: date, location: "", description: "" };
          continue;
        }
      }
    }

    // 5) COMMA SEPARATOR: "Position, Company" — e.g. "Machine Learning Engineer, PystackJs"
    if (rest) {
      const commaMatch = rest.match(/^(.+?),\s*(.+)$/);
      if (commaMatch && !/^\d/.test(rest) && !date) {
        const left = commaMatch[1].trim();
        const right = commaMatch[2].trim();
        if (ROLE_HINTS.test(left) && COMPANY_HINTS.test(right)) {
          if (current) {
            current.description = bulletLines.join("\n");
            items.push(current);
            bulletLines.length = 0;
          }
          current = { company: cleanCompanyName(right), position: left, duration: "", location: "", description: "" };
          continue;
        }
      }
    }

    // 6) STANDALONE DATE on its own line → attach to current entry.
    if (date && !rest) {
      if (current) current.duration = date;
      continue;
    }

    // 7) LINE WITH A DATE AND REMAINING TEXT
    // Could be:
    //   "Acme Corp  Mar 2020 – Present" (company-first)
    //   "Machine Learning Engineer , 2024 – Apr 9" (position-first)
    if (date && rest) {
      if (current) {
        current.description = bulletLines.join("\n");
        items.push(current);
        bulletLines.length = 0;
      }
      // If rest looks like a role/position (not a company), treat as position-first:
      // the company is expected on the next line.
      if (ROLE_HINTS.test(rest) && !COMPANY_HINTS.test(rest)) {
        current = { company: "", position: rest, duration: date, location: "", description: "" };
      } else {
        current = { company: cleanCompanyName(rest), position: "", duration: date, location: "", description: "" };
      }
      continue;
    }

    // 8) STANDALONE SHORT TEXT: could be a company name, position title, or continuation.
    if (rest && rest.length > 1 && rest.length < 60) {
      // Check if it's a company-like line (has corporate suffix)
      if (COMPANY_HINTS.test(rest)) {
        // Position-first format: if current has a position but no company,
        // this line is the company we've been waiting for.
        if (current && !current.company && current.position) {
          current.company = cleanCompanyName(rest);
        } else {
          if (current) {
            current.description = bulletLines.join("\n");
            items.push(current);
            bulletLines.length = 0;
          }
          current = { company: cleanCompanyName(rest), position: "", duration: "", location: "", description: "" };
        }
        continue;
      }
      // Check if it's a role/position line
      if (ROLE_HINTS.test(rest) && !COMPANY_HINTS.test(rest)) {
        if (current && !current.position) {
          // Entry waiting for a position → attach as position
          current.position = rest;
        } else if (current && current.duration && bulletLines.length > 0) {
          // Dated entry that already has description content → this role starts a NEW entry.
          // Flush current, start fresh with this as the pending position.
          current.description = bulletLines.join("\n");
          items.push(current);
          bulletLines.length = 0;
          current = { company: "", position: rest, duration: "", location: "", description: "" };
        } else if (current) {
          bulletLines.push(rest);
        } else {
          // No current entry yet → start entry with this as position
          current = { company: "", position: rest, duration: "", location: "", description: "" };
        }
        continue;
      }
    }

    // 9) LONGER TEXT or unrecognized → description continuation
    if (current && trimmed.length > 5) {
      bulletLines.push(trimmed);
    } else if (!current && trimmed.length > 2 && trimmed.length < 60) {
      // Unknown short line before any entry — treat as potential company
      current = { company: trimmed, position: "", duration: "", location: "", description: "" };
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
  let current: { school: string; degree: string; year: string; field: string } = { school: "", degree: "", year: "", field: "" };

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

/** Known skill proficiency levels. Only these are ever preserved; others are
 *  never inferred — a proficiency is only kept when it is explicit in source. */
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

/**
 * Deterministically split an explicit "Skill – Level", "Skill: Level" or
 * "Skill (Level)" from a skill entry. No proficiency in source → level "".
 * Never infers a level from a plain skill name.
 */
export function splitSkillLevel(
  value: string,
): { name: string; level: string } {
  const v = value.trim();
  const m =
    v.match(/^(.*?)\s*[:\-–—]\s*\b(Beginner|Intermediate|Advanced|Expert)\b\s*$/i) ||
    v.match(/^(.*?)\s+\(?\s*\b(Beginner|Intermediate|Advanced|Expert)\b\s*\)?\s*$/i);
  if (m) {
    const name = (m[1]?.trim() ?? "").replace(/\s+/g, " ");
    const rawLevel = m[2];
    const level = SKILL_LEVELS.find((l) => l.toLowerCase() === rawLevel?.toLowerCase()) ?? "";
    return name ? { name, level } : { name: v, level: "" };
  }
  return { name: v, level: "" };
}

function parseSkillsSection(body: string): ParsedResume["skills"] {
  const items: ParsedResume["skills"] = [];
  // Split by commas, newlines, bullets, pipes
  const parts = body.split(/[,;•\n|*]+/).map(s => s.trim()).filter(s => s.length > 1);

  for (const part of parts) {
    const clean = part.replace(/^skills|\bskills\b/i, "").trim();
    if (clean && clean.length > 1 && !SECTION_HEADERS.some(re => re.test(clean))) {
      const { name, level } = splitSkillLevel(clean);
      // Omit an empty level so the schema default (Intermediate) applies —
      // never invent a proficiency that isn't literally in source. An empty
      // string would be rejected by the LevelSchema enum and crash validation.
      items.push(level ? { name, level, category: "" } : { name, category: "" });
    }
  }

  return items.length > 0 ? items.slice(0, 30) : undefined;
}

function parseProjectsSection(lines: string[]): ParsedResume["projects"] {
  const items: ParsedResume["projects"] = [];
  let current: { name: string; description: string; tech: string } | null = null;
  const descLines: string[] = [];

  const flush = () => {
    if (current) {
      current.description = descLines.join("\n").trim();
      items.push(current);
      descLines.length = 0;
    }
    current = null;
  };

  // Detect tech mentions in any line.
  const TECH_RE = /(?:using|with|built\s*(?:with|using)|tech(?:nology)?\s*:?\s*)(.+)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Strip leading bullet/number markers.
    const clean = trimmed.replace(/^[•\-*\d.)\]\u2022\u25E6\u25AA\u25AB]+\s*/, "").trim();
    if (!clean) continue;

    // A project title is: short (< 80 chars), starts with uppercase, and is
    // NOT a long sentence (<= 12 words).  Also detect bullet-prefixed titles.
    const isTitle =
      clean.length > 2 &&
      clean.length < 80 &&
      /^[A-Z]/.test(clean) &&
      clean.split(/\s+/).length <= 12 &&
      !/[.!?]$/.test(clean); // not ending with period (likely a sentence)

    if (isTitle) {
      flush();
      current = { name: clean, description: "", tech: "" };
      // The same line might carry tech info after a separator.
      const techM = clean.match(TECH_RE);
      if (techM) current.tech = techM[1].trim();
      continue;
    }

    // Everything else is description / detail for the current project.
    if (current) {
      descLines.push(trimmed);
      const techM = trimmed.match(TECH_RE);
      if (techM) current.tech = (current.tech ? current.tech + ", " : "") + techM[1].trim();
    }
  }

  flush();
  return items.length > 0 ? items : undefined;
}

function parseCertificationsSection(lines: string[]): ParsedResume["certifications"] {
  const items: ParsedResume["certifications"] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Strip leading bullet/number markers so the cert name is clean.
    const clean = trimmed.replace(/^[•\-*\d.)\]]+\s*/, "").trim();
    if (!clean) continue;

    const yearMatch = clean.match(/(\d{4})/);
    const issuerMatch = clean.match(/(?:issued\s*(?:by|from)|by|from|via)\s+(.+)/i);

    items.push({
      name: clean.replace(/\(.*?\)/g, "").trim(),
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
    title: parsed.title || "",
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
    // No templateId here: a PDF/DOCX file carries no template choice, so the
    // import must not reset the user's current template. The schema default
    // ("template-1", which is not a real template) marks "unspecified" and the
    // apply step preserves the user's existing templateId.
  };
}

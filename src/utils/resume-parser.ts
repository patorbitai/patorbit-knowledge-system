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
  /(?:summary|profile|objective|about\s*me|professional\s*summary|career\s*summary|career\s*objective|personal\s*statement)/i,
  /(?:experience|work\s*history|employment|work\s*experience|professional\s*experience|professional\s*background|work\s*background|employment\s*history|career\s*history|work\s*experience|relevant\s*experience)/i,
  /(?:education|academic|university|college|school|educational\s*background|academic\s*background|qualifications?)/i,
  /(?:skills|technical\s*skills|core\s*competencies|technical\s*competenc|key\s*skills|technologies|proficiencies|tech\s*stack)/i,
  /(?:projects|project|personal\s*projects|key\s*projects)/i,
  /(?:certifications|certificates|licenses|certifications?\s*&?\s*licenses?)/i,
  /(?:links|portfolio|websites|online\s*presence)/i,
  /(?:publications|research|awards|honors|languages|interests|references)/i,
];

/**
 * Detect and normalize label-based resume formats.
 * Converts:
 *   Company: Amazon
 *   Role: SDE II
 *   Duration: Apr 2021 – Present
 *   Description: Designed microservices
 * Into:
 *   Amazon | SDE II | Apr 2021 – Present
 *   Designed microservices
 */
function normalizeLabelFormat(lines: string[]): string[] {
  const LABEL_RE = /^(Company|Employer|Organization|Org|Role|Title|Position|Job\s*Title|Duration|Timeframe|Period|Dates?|Institute|School|University|College|Degree|Field|Year|Description|Location):\s*(.+)/i;
  const out: string[] = [];
  let i = 0;
  // First check if the file actually uses label format (needs >= 3 label lines)
  const labelCount = lines.filter(l => LABEL_RE.test(l.trim())).length;
  if (labelCount < 3) return lines; // not a label format, return as-is

  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; continue; } // skip blank lines
    const m = t.match(LABEL_RE);
    if (m) {
      // Collect a BLOCK of consecutive label lines (terminated by blank line or non-label)
      const parts: string[] = [];
      let desc = "";
      while (i < lines.length) {
        const ct = lines[i].trim();
        if (!ct) { i++; break; } // blank line = end of block
        const cm = ct.match(LABEL_RE);
        if (cm) {
          const key = cm[1].toLowerCase();
          const val = cm[2].trim();
          if (/^(description|desc)$/i.test(key)) {
            desc = val;
          } else {
            parts.push(val);
          }
          i++;
        } else {
          break;
        }
      }
      if (parts.length > 0) {
        out.push(parts.join(" | "));
      }
      if (desc) {
        out.push(desc);
      }
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out;
}

/**
 * Collapse PDF letter-spacing artifacts in section headers.
 * "SU M M A R Y" → "SUMMARY", "E X P E R I E N C E" → "EXPERIENCE"
 */
function collapseSpacedHeaders(lines: string[]): string[] {
  const HEADER_WORDS = /^(summary|experience|education|skills|projects|certifications|languages|interests|references|profile|objective|employment|academic|qualifications|publications|research|awards|honors|achievements)$/i;
  return lines.map(line => {
    const trimmed = line.trim();
    // Only process short, all-uppercase lines with single-char tokens
    if (trimmed.length > 40 || !/^[A-Z][A-Z ]+$/.test(trimmed)) return line;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 3) return line;
    // Check if collapsing all tokens produces a known header word
    const collapsed = tokens.join("");
    if (HEADER_WORDS.test(collapsed)) return line.replace(trimmed, collapsed);
    return line;
  });
}

export function parseRawResumeText(text: string): ParsedResume {
  const rawLines = text.split("\n");

  // ── Preprocessors (order matters) ──
  // 1. Collapse PDF letter-spacing: "SU M M A R Y" → "SUMMARY"
  const collapsed = collapseSpacedHeaders(rawLines);
  // 2. Normalize label-based formats: "Company: X" → "X | ..."
  const normalized = normalizeLabelFormat(collapsed);
  const lines = normalized.filter(l => l.trim());
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
    // Section headers: must match a known pattern, be short, and NOT be a sentence
    // containing the keyword (e.g. "Data Engineer with experience" is not a header).
    // Require: all-uppercase, or title-case with ≤4 words.
    const matchesSection = SECTION_HEADERS.some(re => re.test(trimmed));
    const isAllUpper = /^[A-Z][A-Z\s&/\-()]+$/.test(trimmed);
    const isShortTitleCase = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}$/.test(trimmed);
    // Exclude institution/school names from being treated as section headers.
    // "Bharathiar University" contains "university" but is a school name, not a section.
    // Only all-uppercase lines ("EDUCATION", "SKILLS") are reliable section headers.
    // Title-case lines matching section keywords are only headers if they are known
    // compound section names ("Work Experience", "Technical Skills"), not institution names.
    const INSTITUTION_WORDS = /\b(?:University|College|Institute|School|Academy|Institut|Universit)\b/i;
    const isExcludedInstitution = isShortTitleCase && !isAllUpper && INSTITUTION_WORDS.test(trimmed);
    const isHeader = matchesSection && trimmed.length < 50 && (isAllUpper || isShortTitleCase) && !isExcludedInstitution;

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

    if (/summary|profile|objective|about\s*me|career\s*(?:summary|objective|goal)|personal\s*statement/i.test(name)) {
      if (!result.summary) {
        result.summary = body.trim();
      }
    }

    if (/experience|work|employment|background|career/i.test(name)) {
      result.experience = parseExperienceSection(section.lines);
    }

    if (/education|university|college|school|academic|qualification/i.test(name)) {
      result.education = parseEducationSection(section.lines);
    }

    if (/skill|competenc|technolog|proficien|tech\s*stack/i.test(name)) {
      result.skills = parseSkillsSection(body);
    }

    if (/project/i.test(name)) {
      result.projects = parseProjectsSection(section.lines);
    }

    if (/certific|licens/i.test(name)) {
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

  const RE_DATE_RANGE = new RegExp(DATE_RANGE_PAT, "i");
  const RE_DATE_SINGLE = new RegExp("(?:\\()?" + DATE_SINGLE_PAT + "(?:\\))?", "i");

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
  /** Strip trailing/leading parens from rest text when date was inside parens. */
  const cleanRest = (s: string) => s.replace(/\s*[($]+\s*$/, "").replace(/\s+/g, " ").trim();

  const extractDate = (text: string): { date: string; rest: string } => {
    const rm = RE_DATE_RANGE.exec(text);
    if (rm) {
      const date = rm[0].replace(/^[()]+|[()]+$/g, "").trim();
      return { date, rest: cleanRest(text.slice(0, rm.index)) };
    }
    const sm = RE_DATE_SINGLE.exec(text);
    if (sm) {
      const date = sm[0].replace(/^[()]+|[()]+$/g, "").trim();
      return { date, rest: cleanRest(text.slice(0, sm.index)) };
    }
    return { date: "", rest: text };
  };

  /** Check if a line is a bullet/achievement marker. */
  const isBullet = (t: string) => /^[•·▪◦∙\-*\d.]/.test(t);

  /** Detect a pipe "Company | Position" separator (not hyphens/en-dashes). */
  const PIPE_SEP = /^(.+?)\s*\|\s*(.+)$/;

  /** Check if text looks like a role/position title (not a company). */
  const ROLE_HINTS = /\b(?:Engineer|Developer|Manager|Director|Lead|Architect|Analyst|Designer|Consultant|Specialist|Coordinator|Supervisor|Officer|Executive|VP|CTO|CEO|CFO|COO|Head|Principal|Senior|Junior|Staff|Associate|Intern|Freelance|Scientist|Researcher|Professor|Teacher|Nurse|Doctor|Technician|Operator)\b/i;
  const COMPANY_HINTS = /\b(?:Inc|LLC|Ltd|Corp|Co|GmbH|Pvt|Limited|Company|Group|Technologies|Tech|Solutions|Services|Systems|Labs|Studio|Consulting|Analytics|Enterprises|Holdings|Ventures|Industries)\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1) BULLET SEPARATOR: "Company • Date • Location" format.
    //    Split on • and reassemble into structured fields.
    if (trimmed.includes("•")) {
      const parts = trimmed.split("•").map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Try to identify which parts are: company, date, location
        let company = "";
        let position = "";
        let dateStr = "";
        let location = "";

        for (const part of parts) {
          const partDate = extractDate(part);
          if (partDate.date) {
            dateStr = partDate.date;
            // The non-date part of this segment might be a company name
            if (partDate.rest && !company) company = partDate.rest;
          } else if (!dateStr && !company) {
            // No date found yet — this could be company or position.
            // Check for em-dash separator: "Company — Position" or "Upwork — Freelance"
            const dashParts = part.split(/\s*[\u2013\u2014—]\s*/);
            if (dashParts.length >= 2) {
              const left = dashParts[0].trim();
              const right = dashParts.slice(1).join(" — ").trim();
              if (ROLE_HINTS.test(right) && !COMPANY_HINTS.test(right)) {
                company = cleanCompanyName(left);
                position = right;
              } else if (ROLE_HINTS.test(left) && !COMPANY_HINTS.test(left)) {
                position = left;
                company = cleanCompanyName(right);
              } else {
                company = cleanCompanyName(part);
              }
            } else if (ROLE_HINTS.test(part) && !COMPANY_HINTS.test(part)) {
              position = part;
            } else {
              company = cleanCompanyName(part);
            }
          } else if (dateStr && company) {
            // After date and company — this is location
            location = part;
          }
        }

        if (company || position || dateStr) {
          // If current entry has a position but no company/duration, this • line
          // is the company+date+location for that entry — update it, don't replace.
          if (current && current.position && !current.company && !current.duration) {
            if (company) current.company = company;
            if (dateStr) current.duration = dateStr;
            if (location) current.location = location;
            continue;
          }
          if (current) {
            current.description = bulletLines.join("\n");
            items.push(current);
            bulletLines.length = 0;
          }
          current = {
            company: company,
            position: position,
            duration: dateStr,
            location: location,
            description: "",
          };
          continue;
        }
      }
    }

    // 2) BULLET/ACHIEVEMENT LINES → always description, never a new entry.
    //    BUT: skip lines that are actually dates ("2020-Present", "Jan 2022")
    //    — digits at the start don't mean bullet here.
    const isDateLine = RE_DATE_RANGE.test(trimmed) || RE_DATE_SINGLE.test(trimmed);
    if ((isBullet(trimmed) || /^-\s/.test(trimmed)) && !isDateLine) {
      bulletLines.push(trimmed);
      continue;
    }

    // 3) EXTRACT DATE from the line (handles "2024 – Apr 9", "Apr 2022 – Jan 2024", etc.)
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
    //    Split when one side looks like a role or has a company hint.
    //    IMPORTANT: Do NOT split on date-range hyphens ("Jan 2024 - Apr 2024").
    //    Also skip when accumulating description (bullets present).
    if (rest && !date && bulletLines.length === 0) {
      const dashMatch = rest.match(/^(.+?)\s+[–—-]\s+(.+)$/);
      if (dashMatch && !/^\d/.test(rest) && dashMatch[1].trim().length > 1 && dashMatch[2].trim().length > 1) {
        // Skip if this looks like a date range (both sides contain month names or years)
        const rightHasYear = /\b\d{4}\b/.test(dashMatch[2]);
        const leftHasMonth = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(dashMatch[1]);
        if (rightHasYear && leftHasMonth) {
          // This is a date range, not a company–position split
          bulletLines.push(trimmed);
          continue;
        }
        const left = dashMatch[1].trim();
        const right = dashMatch[2].trim();
        if (ROLE_HINTS.test(right) || COMPANY_HINTS.test(right)) {
          if (current) {
            current.description = bulletLines.join("\n");
            items.push(current);
            bulletLines.length = 0;
          }
          current = { company: cleanCompanyName(left), position: right, duration: date, location: "", description: "" };
          continue;
        }
        if (ROLE_HINTS.test(left) || COMPANY_HINTS.test(left)) {
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
    //    Only apply when NOT accumulating description text (no bullets yet for current entry).
    //    Commas inside description prose ("Azure SQL, Azure Synapse") must NOT be split.
    if (rest && bulletLines.length === 0) {
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
    //   "Meta (Facebook)  2021 – Present" (date-rail: company+date, role was on previous line)
    if (date && rest) {
      // Date-rail: if current has a position but no company AND no duration yet,
      // this line is the company+date for the current entry.
      if (current && current.position && !current.company && !current.duration) {
        current.company = cleanCompanyName(rest);
        current.duration = date;
        continue;
      }
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

    // 7b) BULLET CONTINUATION: if we're accumulating description for a
    //     bullet point (bulletLines.length > 0), treat lines that look
    //     like sentence continuations as description, not new entries.
    //     This prevents false splits on "Engineer", "Solutions", etc.
    //     inside normal description text.
    if (current && bulletLines.length > 0 && !date) {
      const startsWithLower = /^[a-z]/.test(rest);
      const isContinuationWord = /^(?:for|with|using|to|the|a|an|in|on|by|of|and|or|that|which|while|as|from|into|through|over|under|across|after|before|between|during|without|within)\b/i.test(rest);
      const isLongLine = rest.length > 60;
      // Hyphenated compounds like "Engineer-level", "data-driven" are
      // adjectives, not standalone role titles.
      const hasHyphenCompound = /\b\w+[-\u2013]\w+\b/.test(rest) && rest.length > 15;
      // Lines that look like a role/position title should NOT be treated as
      // description continuation, even if they exceed the line-length threshold.
      const looksLikeTitle = ROLE_HINTS.test(rest) && !/[,.;:!?]$/.test(rest) && rest.split(/\s+/).length <= 8;

      if (startsWithLower || isContinuationWord || (isLongLine && !looksLikeTitle) || hasHyphenCompound) {
        bulletLines.push(trimmed);
        continue;
      }
      // Otherwise, fall through — this might be a new entry header
    }

    // 8) STANDALONE SHORT TEXT: could be a company name, position title, or continuation.
    if (rest && rest.length > 1 && rest.length < 60) {
      // Check if it's a company-like line (has corporate suffix).
      // Require: short (≤6 words), no sentence punctuation, and looks like a proper name.
      // "Analytics supporting storage" contains "Analytics" but is a sentence, not a company.
      const isCompanyName = COMPANY_HINTS.test(rest) && rest.split(/\s+/).length <= 6 && !/[.!?]$/.test(rest) && /^[A-Z]/.test(rest);
      if (isCompanyName) {
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
    if (current && trimmed.length > 0) {
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
  let current: { school: string; degree: string; year: string; field: string } | null = null;

  const flush = () => {
    if (current && current.school) items.push(current);
    current = null;
  };

  const SCHOOL_RE = /(?:University|College|Institute|School|Academy|Institut|Universit)/i;
  const DEGREE_RE = /(?:B\.?\s*[ASCE]|M\.?\s*[ASCE]|Ph\.?\s*D|Bachelor|Master|Associate|MBA|Doctorate|B\.Sc|B\.A|B\.S|M\.S|M\.Tech|B\.Tech|MCA|BCA)/i;
  const YEAR_RE = /(\d{4})\s*(?:-|–|\u2013|to)\s*(?:\w+\s+)?(\d{4}|Present|current)/i;
  const YEAR_SINGLE = /(?:\b|\s)(\d{4})(?:\b|$)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extract year from the line (handles "2016-2018", "2016–2018", "(2016)" etc.)
    const yearM = YEAR_RE.exec(trimmed) || YEAR_SINGLE.exec(trimmed);
    let yearStr = yearM ? yearM[0].trim() : "";
    // Clean up year string: "2016 - December 2018" → "2016 - 2018"
    if (yearStr) {
      yearStr = yearStr.replace(/\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+/gi, " ").replace(/\s+/g, " ").trim();
    }
    const textWithoutYear = yearStr ? trimmed.replace(yearM![0], "").replace(/[,;()*•]+/g, " ").replace(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi, "").replace(/\s+/g, " ").trim() : trimmed;

    // School+year on same line: "Bharathiar University 2016-2018"
    if (SCHOOL_RE.test(textWithoutYear)) {
      flush();
      current = { school: textWithoutYear, degree: "", year: yearStr, field: "" };
      continue;
    }

    // Degree pattern
    if (DEGREE_RE.test(textWithoutYear)) {
      if (current) {
        current.degree = textWithoutYear;
      } else {
        current = { school: "", degree: textWithoutYear, year: yearStr, field: "" };
      }
      if (yearStr && !current.year) current.year = yearStr;
      continue;
    }

    // Standalone year → attach to current
    if (yearStr && !textWithoutYear) {
      if (current && !current.year) current.year = yearStr;
      continue;
    }

    // Unknown line: if no current entry, this might be a short school name ("MIT", "Stanford")
    if (!current && textWithoutYear.length > 1 && textWithoutYear.length < 40 && /^[A-Z]/.test(textWithoutYear)) {
      current = { school: textWithoutYear, degree: "", year: yearStr, field: "" };
      continue;
    }

    // Otherwise, treat as field of study or extra info
    if (current && !current.field && textWithoutYear.length > 2) {
      current.field = textWithoutYear;
    }
  }

  flush();
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
  const parts = body.split(/[,;•·\n|*\-–—]+/).map(s => s.trim()).filter(s => s.length > 1);

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

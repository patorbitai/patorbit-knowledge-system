/* ── Resume Builder Validation ── */

export type ValidationErrors = Record<string, string>;
export type ArrayValidationErrors = ValidationErrors[];
export type TouchedFields = Record<string, boolean>;

/** Per-section field validation rules */
export const SECTION_RULES: Record<string, Record<string, string>> = {
  personal: {
    name: "Full name is required",
    email: "Email is required",
    phone: "Phone is required",
  },
  social: {},
  experience: {
    company: "Company name is required",
    position: "Position is required",
  },
  education: {
    school: "School / University is required",
    degree: "Degree is required",
  },
  skills: {
    name: "Skill name is required",
  },
  projects: {
    name: "Project name is required",
  },
  certifications: {
    name: "Certification name is required",
  },
  achievements: {
    title: "Achievement title is required",
  },
  languages: {
    name: "Language is required",
  },
  portfolio: {
    title: "Portfolio item title is required",
    url: "Portfolio item URL is required",
  },
};

/* ── Helpers ── */

/** Returns true if a value is considered "empty" */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

/** Basic email regex */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Phone regex — allows international formats */
const PHONE_RE = /^[\d()+\-\s]{7,20}$/;

/* ── Field-level validators ── */

function validateEmail(value: string): string | null {
  if (!value.trim()) return null;
  if (!EMAIL_RE.test(value)) return "Invalid email format";
  return null;
}

function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  if (!PHONE_RE.test(value)) return "Invalid phone number format";
  return null;
}

/* ── Section validators ── */

import type { SocialLinks } from "@/types/resume";

export interface ValidationContext {
  name: string;
  email: string;
  phone: string;
  title: string;
  address: string;
  nationality: string;
  pronouns: string;
  summary: string;
  social: SocialLinks;
}

/** Validate the Personal Info section */
export function validatePersonalSection(ctx: ValidationContext): ValidationErrors {
  const errors: ValidationErrors = {};
  const { name, email, phone } = ctx;

  if (isEmpty(name)) errors.name = SECTION_RULES.personal.name;
  if (isEmpty(email)) errors.email = SECTION_RULES.personal.email;
  else {
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
  }
  if (isEmpty(phone)) errors.phone = SECTION_RULES.personal.phone;
  else {
    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.phone = phoneErr;
  }

  return errors;
}

/** Validate an array-based section (experience, education, skills, projects, certifications) */
export function validateArraySection<T extends object>(
  items: T[],
  requiredFields: string[],
): ArrayValidationErrors {
  return items.map((item) => {
    const errors: ValidationErrors = {};
    for (const field of requiredFields) {
      if (isEmpty(item[field as keyof T])) errors[field] = "Required";
    }
    return errors;
  });
}

/** Validate the whole resume and return a map of section -> errors */
export function validateAll(
  ctx: ValidationContext,
  sections: Record<string, Record<string, unknown>[]>,
): Record<string, ValidationErrors | ArrayValidationErrors> {
  return {
    personal: validatePersonalSection(ctx),
    social: {},
    experience: validateArraySection(sections.experience ?? [], REQUIRED_FIELDS.experience),
    education: validateArraySection(sections.education ?? [], REQUIRED_FIELDS.education),
    skills: validateArraySection(sections.skills ?? [], REQUIRED_FIELDS.skills),
    projects: validateArraySection(sections.projects ?? [], REQUIRED_FIELDS.projects),
    certifications: validateArraySection(sections.certifications ?? [], REQUIRED_FIELDS.certifications),
  };
}

/** Check if a section has any validation errors */
export function hasSectionErrors(
  section: string,
  allErrors: Record<string, ValidationErrors | ArrayValidationErrors>,
): boolean {
  const secErrors = allErrors[section];
  if (!secErrors) return false;
  if (Array.isArray(secErrors)) {
    if (secErrors.length === 0) return false;
    return secErrors.some((e) => Object.keys(e).length > 0);
  }
  return Object.keys(secErrors).length > 0;
}

/** Get a friendly error message for a specific field in a section */
export function getFieldError(
  section: string,
  fieldName: string,
  itemIndex: number | null,
  allErrors: Record<string, ValidationErrors | ArrayValidationErrors>,
): string | undefined {
  const secErrors = allErrors[section];
  if (!secErrors) return undefined;
  if (Array.isArray(secErrors)) {
    if (itemIndex === null || itemIndex < 0 || itemIndex >= secErrors.length) return undefined;
    return secErrors[itemIndex][fieldName];
  }
  return secErrors[fieldName];
}

/** Required fields mapping for array sections */
export const REQUIRED_FIELDS: Record<string, string[]> = {
  experience: ["company", "position"],
  education: ["school", "degree"],
  skills: ["name"],
  projects: ["name"],
  certifications: ["name"],
  achievements: ["title"],
  languages: ["name"],
  portfolio: ["title", "url"],
};

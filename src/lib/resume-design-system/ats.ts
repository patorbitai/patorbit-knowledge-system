export const atsDateFormat = {
  separator: " – ",
  presentLabel: "Present",
  format: (start: string, end?: string) =>
    `${start}${atsDateFormat.separator}${end || atsDateFormat.presentLabel}`,
} as const;

export const atsHeadingHierarchy = {
  name:    "h1",
  section: "h2",
  entry:   "h3",
} as const;

export const atsContactOrder = [
  "name",
  "title",
  "email",
  "phone",
  "address",
  "linkedin",
  "website",
] as const;

export const atsSectionOrder = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "interests",
  "achievements",
  "references",
] as const;

export const atsHtmlConstraints = {
  noTables: true,
  noTextBoxes: true,
  noColumns: "avoid for single-column ATS",
  noImages: true,
  noHeaderFooter: true,
  noSpecialCharacters: "avoid decorative bullets beyond • – —",
} as const;

export function formatDuration(
  duration?: string,
  startDate?: string,
  endDate?: string,
): string {
  if (duration) return duration;
  if (startDate)
    return atsDateFormat.format(startDate, endDate || undefined);
  return "";
}

export type TimelineEventType = "role-start" | "role-end" | "education" | "project" | "certification";

export interface TimelineEventItem {
  date: string;
  type: TimelineEventType;
  label: string;
  nodeId: string;
  isCurrent?: boolean;
}

const monthNames: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

export function parseTimelineDate(dateStr: string): number {
  if (!dateStr) return 0;
  const lower = dateStr.toLowerCase().trim();
  if (lower === "present" || lower === "current" || lower.includes("present")) {
    return Date.now();
  }
  // Handle year-only strings (e.g. "2026") as end of year so they sort correctly after present
  if (/^\d{4}$/.test(dateStr)) {
    const y = parseInt(dateStr, 10);
    return new Date(y, 11, 31).getTime();
  }
  const parts = dateStr.replace(/,/g, "").split(/\s+/);
  if (parts.length >= 2 && monthNames[parts[0].slice(0, 3).toLowerCase()] !== undefined) {
    const m = monthNames[parts[0].slice(0, 3).toLowerCase()];
    const y = parseInt(parts[1], 10);
    if (!isNaN(y)) {
      return new Date(y, m, 1).getTime();
    }
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.getTime();
  }
  return 0;
}

const typePriority: Record<TimelineEventType, number> = {
  "role-end": 1,
  "role-start": 2,
  "education": 3,
  "project": 4,
  "certification": 5,
};

export function sortTimelineEvents(
  events: TimelineEventItem[],
  direction: "oldest-to-newest" | "newest-to-oldest" = "oldest-to-newest"
): TimelineEventItem[] {
  const sorted = [...events].sort((a, b) => {
    const timeA = parseTimelineDate(a.date);
    const timeB = parseTimelineDate(b.date);

    if (timeA !== timeB) {
      return direction === "oldest-to-newest" ? timeA - timeB : timeB - timeA;
    }

    // Same-date ordering: role-end before role-start
    const priA = typePriority[a.type] || 9;
    const priB = typePriority[b.type] || 9;
    return direction === "oldest-to-newest" ? priA - priB : priB - priA;
  });

  return sorted;
}

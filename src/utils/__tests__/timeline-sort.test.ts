import { describe, it, expect } from "vitest";
import { sortTimelineEvents, parseTimelineDate, TimelineEventItem } from "../timeline-sort";

describe("Timeline Sorting Utility", () => {
  it("parses dates correctly", () => {
    expect(parseTimelineDate("May 2020")).toBeLessThan(parseTimelineDate("Apr 2022"));
    expect(parseTimelineDate("Apr 2022")).toBeLessThan(parseTimelineDate("Jan 2024"));
    expect(parseTimelineDate("Jan 2024")).toBeLessThan(parseTimelineDate("Apr 2024"));
    expect(parseTimelineDate("Apr 2024")).toBeLessThan(parseTimelineDate("Present"));
    expect(parseTimelineDate("Present")).toBeLessThan(parseTimelineDate("2026"));
  });

  it("sorts chronological timeline oldest to newest correctly with same-month role end/start", () => {
    const events: TimelineEventItem[] = [
      { date: "2026", type: "project", label: "Enterprise GenAI RAG Knowledge Assistant", nodeId: "p1" },
      { date: "Present", type: "role-end", label: "AI/ML Engineer (Current)", nodeId: "r3", isCurrent: true },
      { date: "Apr 2024", type: "role-start", label: "Started AI/ML Engineer", nodeId: "r3" },
      { date: "Jan 2024", type: "role-end", label: "Ended Data Engineer", nodeId: "r2" },
      { date: "Apr 2022", type: "role-start", label: "Started Data Engineer", nodeId: "r2" },
      { date: "Apr 2022", type: "role-end", label: "Ended Data Analyst / Consultant", nodeId: "r1" },
      { date: "May 2020", type: "role-start", label: "Started Data Analyst / Consultant", nodeId: "r1" },
    ];

    const sorted = sortTimelineEvents(events, "oldest-to-newest");

    expect(sorted[0].label).toContain("Started Data Analyst");
    expect(sorted[1].label).toContain("Ended Data Analyst");
    expect(sorted[2].label).toContain("Started Data Engineer");
    expect(sorted[3].label).toContain("Ended Data Engineer");
    expect(sorted[4].label).toContain("Started AI/ML Engineer");
    expect(sorted[5].label).toContain("AI/ML Engineer (Current)");
    expect(sorted[6].label).toContain("Enterprise GenAI RAG");
  });

  it("sorts chronological timeline newest to oldest correctly", () => {
    const events: TimelineEventItem[] = [
      { date: "May 2020", type: "role-start", label: "Started Data Analyst", nodeId: "r1" },
      { date: "2026", type: "project", label: "Enterprise GenAI RAG", nodeId: "p1" },
    ];

    const sorted = sortTimelineEvents(events, "newest-to-oldest");
    expect(sorted[0].label).toContain("Enterprise GenAI RAG");
    expect(sorted[1].label).toContain("Started Data Analyst");
  });
});

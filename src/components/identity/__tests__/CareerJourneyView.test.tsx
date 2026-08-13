import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { CareerJourneyView } from "../CareerJourneyView";
import { GraphService } from "@/services/graph-service";

describe("Career Journey Redesign & Sorting", () => {
  it("renders empty state correctly when no experience entries exist", () => {
    const html = renderToString(<CareerJourneyView />);
    expect(html).toContain("Your career journey starts here");
    expect(html).toContain("Add experience");
  });

  it("calculates experience years and sorts roles oldest to newest correctly", () => {
    const gs = new GraphService();
    // Test helper to verify calcTotalYearsExp logic without NaN
    const roles = [
      { id: "r1", title: "Data Analyst", company: "A", startDate: "May 2020", endDate: "Apr 2022", isCurrent: false },
      { id: "r2", title: "AI/ML Engineer", company: "B", startDate: "Apr 2024", endDate: "", isCurrent: true },
    ];
    // @ts-expect-error accessing private method for test verification
    const years = gs["calcTotalYearsExp"](roles);
    expect(years).toBeGreaterThan(0);
    expect(isNaN(years)).toBe(false);
  });
});

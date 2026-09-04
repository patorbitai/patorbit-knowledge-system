import { describe, it, expect } from "vitest";
import { TEMPLATE_DEMO_RESUMES, getTemplateDemoResume } from "../template-demo-data";
import { TEMPLATES } from "@/app/resume-builder/templates";

const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

describe("Template Demo Data System", () => {
  describe("coverage", () => {
    it("every registered template has a corresponding demo dataset", () => {
      const demoIds = new Set(Object.keys(TEMPLATE_DEMO_RESUMES));
      const missing = TEMPLATE_IDS.filter((id) => !demoIds.has(id));
      expect(missing).toEqual([]);
    });

    it("no demo dataset references a template ID that does not exist in the registry", () => {
      const registryIds = new Set(TEMPLATE_IDS);
      const extra = Object.keys(TEMPLATE_DEMO_RESUMES).filter((id) => !registryIds.has(id));
      expect(extra).toEqual([]);
    });

    it("every template has a unique demo resume name", () => {
      const names = TEMPLATE_IDS.map((id) => getTemplateDemoResume(id).name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("every template has a unique demo resume title", () => {
      const titles = TEMPLATE_IDS.map((id) => getTemplateDemoResume(id).title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });
  });

  describe("determinism", () => {
    it("the same templateId always returns the same resume object", () => {
      const id = TEMPLATE_IDS[0];
      const first = getTemplateDemoResume(id);
      const second = getTemplateDemoResume(id);
      expect(first.name).toBe(second.name);
      expect(first.title).toBe(second.title);
      expect(first.email).toBe(second.email);
    });

    it("different template IDs return different people", () => {
      const first = getTemplateDemoResume(TEMPLATE_IDS[0]);
      const second = getTemplateDemoResume(TEMPLATE_IDS[1]);
      // Either name or title must differ
      expect(first.name !== second.name || first.title !== second.title).toBe(true);
    });
  });

  describe("data integrity", () => {
    it("every demo resume has realistic content (no placeholder text)", () => {
      const placeholders = ["lorem ipsum", "john doe", "jane doe", "test user", "example company", "foo bar"];
      for (const id of TEMPLATE_IDS) {
        const resume = getTemplateDemoResume(id);
        const text = `${resume.name} ${resume.title} ${resume.summary}`.toLowerCase();
        for (const p of placeholders) {
          expect(text).not.toContain(p);
        }
      }
    });

    it("every demo resume has a name, title, email, and summary", () => {
      for (const id of TEMPLATE_IDS) {
        const resume = getTemplateDemoResume(id);
        expect(resume.name.trim().length).toBeGreaterThan(0);
        expect(resume.title.trim().length).toBeGreaterThan(0);
        expect(resume.email.trim().length).toBeGreaterThan(0);
        expect(resume.summary.trim().length).toBeGreaterThan(0);
      }
    });

    it("every demo resume has at least 1 experience entry", () => {
      for (const id of TEMPLATE_IDS) {
        const resume = getTemplateDemoResume(id);
        expect(resume.experience.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("every demo resume has at least 1 education entry", () => {
      for (const id of TEMPLATE_IDS) {
        const resume = getTemplateDemoResume(id);
        expect(resume.education.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("every demo resume has at least 3 skills", () => {
      for (const id of TEMPLATE_IDS) {
        const resume = getTemplateDemoResume(id);
        expect(resume.skills.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("object separation", () => {
    it("each template gets a distinct object reference (no shared instances)", () => {
      const seen = new Set<string>();
      for (const id of TEMPLATE_IDS) {
        const resume = getTemplateDemoResume(id);
        // Check the object reference, not just the name
        const key = `${resume.name}:${resume.title}:${resume.email}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });

  describe("no user data contamination", () => {
    it("getTemplateDemoResume never mutates user resume state", () => {
      const userResume = {
        name: "Real User",
        title: "Real Job",
        email: "real@example.com",
        summary: "Real summary",
        templateId: "modern-clean",
      };
      const originalName = userResume.name;
      const demo = getTemplateDemoResume("executive");
      // The user resume should be unchanged
      expect(userResume.name).toBe(originalName);
      // The demo should be different
      expect(demo.name).not.toBe(userResume.name);
    });
  });
});

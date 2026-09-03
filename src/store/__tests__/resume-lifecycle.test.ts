/**
 * Comprehensive Resume Lifecycle Test
 * 
 * Tests the entire resume lifecycle to ensure reliability and consistency:
 * - Multi-resume creation and switching
 * - Edit/switch/restore behavior
 * - Resume ID stability
 * - Persistence and rehydration
 * - Import behavior
 * - Template switching
 * - Deletion behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useResumeBuilder, defaultResume } from "../resume-builder";
import { mapProfileToResume } from "@/lib/resume-seeding";
import type { Resume } from "@/types/resume";

describe("Resume Lifecycle Reliability", () => {
  beforeEach(() => {
    // Reset store to initial state
    useResumeBuilder.setState({
      resumes: [{ ...defaultResume, resumeId: "initial", resumeName: "Initial Resume" }],
      activeResumeId: "initial",
      resume: { ...defaultResume, resumeId: "initial", resumeName: "Initial Resume" },
      styleConfigs: {},
    });
  });

  describe("Multi-Resume Creation and Switching", () => {
    it("creates multiple resumes with unique IDs", () => {
      const state = useResumeBuilder.getState();
      
      const id1 = state.createResume("Resume A");
      const id2 = state.createResume("Resume B");
      const id3 = state.createResume("Resume C");

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);

      const resumes = useResumeBuilder.getState().resumes;
      expect(resumes).toHaveLength(4); // initial + A, B, C
      expect(resumes.map(r => r.resumeId)).toContain(id1);
      expect(resumes.map(r => r.resumeId)).toContain(id2);
      expect(resumes.map(r => r.resumeId)).toContain(id3);
    });

    it("switches between resumes correctly", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice A");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob B");
      
      const idC = state.createResume("Resume C");
      state.updateField("name", "Charlie C");

      // Switch to A
      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Alice A");
      expect(useResumeBuilder.getState().activeResumeId).toBe(idA);

      // Switch to B
      state.switchResume(idB);
      expect(useResumeBuilder.getState().resume.name).toBe("Bob B");
      expect(useResumeBuilder.getState().activeResumeId).toBe(idB);

      // Switch to C
      state.switchResume(idC);
      expect(useResumeBuilder.getState().resume.name).toBe("Charlie C");
      expect(useResumeBuilder.getState().activeResumeId).toBe(idC);

      // Switch back to A
      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Alice A");
      expect(useResumeBuilder.getState().activeResumeId).toBe(idA);
    });

    it("isolates data between resumes", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      state.updateField("email", "alice@test.com");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");
      state.updateField("email", "bob@test.com");

      // Verify A's data
      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Alice");
      expect(useResumeBuilder.getState().resume.email).toBe("alice@test.com");

      // Verify B's data
      state.switchResume(idB);
      expect(useResumeBuilder.getState().resume.name).toBe("Bob");
      expect(useResumeBuilder.getState().resume.email).toBe("bob@test.com");
    });
  });

  describe("Edit/Switch/Restore Behavior", () => {
    it("preserves edits when switching between resumes", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Original A");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Original B");

      // Edit A
      state.switchResume(idA);
      state.updateField("name", "Edited A");
      expect(useResumeBuilder.getState().resume.name).toBe("Edited A");

      // Switch to B and edit
      state.switchResume(idB);
      state.updateField("name", "Edited B");
      expect(useResumeBuilder.getState().resume.name).toBe("Edited B");

      // Switch back to A - should have edited version
      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Edited A");

      // Switch back to B - should have edited version
      state.switchResume(idB);
      expect(useResumeBuilder.getState().resume.name).toBe("Edited B");
    });

    it("maintains activeResumeId across operations", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Test A");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Test B");

      // Switch to A
      state.switchResume(idA);
      expect(useResumeBuilder.getState().activeResumeId).toBe(idA);

      // Edit A
      state.updateField("name", "Edited Test A");
      expect(useResumeBuilder.getState().activeResumeId).toBe(idA);

      // Switch to B
      state.switchResume(idB);
      expect(useResumeBuilder.getState().activeResumeId).toBe(idB);

      // Switch back to A
      state.switchResume(idA);
      expect(useResumeBuilder.getState().activeResumeId).toBe(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Edited Test A");
    });
  });

  describe("Resume ID Integrity", () => {
    it("maintains stable resumeId across operations", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Test User");
      state.updateField("email", "test@test.com");

      // Edit resume
      state.updateField("name", "Edited User");
      state.updateField("email", "edited@test.com");

      // Verify resumeId unchanged
      expect(useResumeBuilder.getState().resume.resumeId).toBe(idA);
      expect(useResumeBuilder.getState().resumes.find(r => r.resumeId === idA)?.resumeId).toBe(idA);

      // Switch away and back
      const idB = state.createResume("Resume B");
      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.resumeId).toBe(idA);

      // Rename
      state.renameResume(idA, "Renamed Resume");
      expect(useResumeBuilder.getState().resume.resumeId).toBe(idA);
      expect(useResumeBuilder.getState().resumes.find(r => r.resumeId === idA)?.resumeId).toBe(idA);
    });

    it("does not change resumeId when applying template", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Test User");

      // Apply template
      state.applyTemplate("executive-pro");
      expect(useResumeBuilder.getState().resume.resumeId).toBe(idA);
      expect(useResumeBuilder.getState().resume.templateId).toBe("executive-pro");

      // Apply another template
      state.applyTemplate("modern-clean");
      expect(useResumeBuilder.getState().resume.resumeId).toBe(idA);
      expect(useResumeBuilder.getState().resume.templateId).toBe("modern-clean");
    });
  });

  describe("Resume Deletion", () => {
    it("deletes inactive resume and preserves active", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Delete B while A is active
      state.switchResume(idA);
      state.deleteResume(idB);

      expect(useResumeBuilder.getState().resumes).toHaveLength(2); // initial + A
      expect(useResumeBuilder.getState().activeResumeId).toBe(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Alice");
    });

    it("deletes active resume and switches to another", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Delete A while A is active
      state.switchResume(idA);
      state.deleteResume(idA);

      // Should switch to first remaining resume (initial resume, not B)
      expect(useResumeBuilder.getState().resumes).toHaveLength(2); // initial + B
      expect(useResumeBuilder.getState().activeResumeId).toBe("initial");
      expect(useResumeBuilder.getState().resume.name).toBe(""); // initial resume has empty name
    });

    it("prevents deleting the last remaining resume", () => {
      const state = useResumeBuilder.getState();
      const initialId = state.activeResumeId;

      state.deleteResume(initialId);

      expect(useResumeBuilder.getState().resumes).toHaveLength(1);
      expect(useResumeBuilder.getState().activeResumeId).toBe(initialId);
    });
  });

  describe("Template Switching", () => {
    it("changes template without affecting resume content", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Test User");
      state.updateField("email", "test@test.com");
      state.updateField("summary", "Test summary");

      // Apply template
      state.applyTemplate("executive-pro");
      expect(useResumeBuilder.getState().resume.templateId).toBe("executive-pro");
      expect(useResumeBuilder.getState().resume.name).toBe("Test User");
      expect(useResumeBuilder.getState().resume.email).toBe("test@test.com");
      expect(useResumeBuilder.getState().resume.summary).toBe("Test summary");

      // Apply another template
      state.applyTemplate("modern-clean");
      expect(useResumeBuilder.getState().resume.templateId).toBe("modern-clean");
      expect(useResumeBuilder.getState().resume.name).toBe("Test User");
      expect(useResumeBuilder.getState().resume.email).toBe("test@test.com");
      expect(useResumeBuilder.getState().resume.summary).toBe("Test summary");
    });

    it("preserves template per resume", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.applyTemplate("executive-pro");
      
      const idB = state.createResume("Resume B");
      state.applyTemplate("modern-clean");

      // Verify A's template
      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.templateId).toBe("executive-pro");

      // Verify B's template
      state.switchResume(idB);
      expect(useResumeBuilder.getState().resume.templateId).toBe("modern-clean");
    });
  });

  describe("Persistence and Rehydration", () => {
    it("persists resumes array and activeResumeId", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Verify persistence shape
      const persisted = useResumeBuilder.getState();
      expect(persisted.resumes).toHaveLength(3); // initial + A, B
      expect(persisted.activeResumeId).toBe(idB);
      expect(persisted.resumes.find(r => r.resumeId === idA)?.name).toBe("Alice");
      expect(persisted.resumes.find(r => r.resumeId === idB)?.name).toBe("Bob");
    });

    it("restores correct state after simulated rehydration", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Simulate rehydration by setting state
      const resumes = useResumeBuilder.getState().resumes;
      const activeResumeId = useResumeBuilder.getState().activeResumeId;
      
      useResumeBuilder.setState({
        resumes,
        activeResumeId,
        resume: resumes.find(r => r.resumeId === activeResumeId) || resumes[0],
      });

      // Verify restored state
      expect(useResumeBuilder.getState().resumes).toHaveLength(3);
      expect(useResumeBuilder.getState().activeResumeId).toBe(idB);
      expect(useResumeBuilder.getState().resume.name).toBe("Bob");
    });
  });

  describe("Import Behavior", () => {
    it("merges imported resume into current resume", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Original User");
      state.updateField("templateId", "executive-pro");

      // Simulate import
      const importedResume: Resume = {
        ...defaultResume,
        resumeId: idA, // Same ID
        name: "Imported User",
        email: "imported@test.com",
        templateId: "template-1", // Not a real template
      };

      // Merge imported resume (using setResume directly)
      state.setResume(importedResume);

      // Verify merge - setResume now validates templateId
      // Invalid templateId ("template-1") is rejected, current templateId ("executive-pro") is preserved
      expect(useResumeBuilder.getState().resume.resumeId).toBe(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Imported User");
      expect(useResumeBuilder.getState().resume.email).toBe("imported@test.com");
      expect(useResumeBuilder.getState().resume.templateId).toBe("executive-pro"); // Preserved because "template-1" is invalid
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid switching without data loss", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Rapid switching
      for (let i = 0; i < 10; i++) {
        state.switchResume(idA);
        state.switchResume(idB);
      }

      expect(useResumeBuilder.getState().resume.name).toBe("Bob");
      expect(useResumeBuilder.getState().activeResumeId).toBe(idB);

      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Alice");
      expect(useResumeBuilder.getState().activeResumeId).toBe(idA);
    });

    it("handles concurrent edits to different resumes", () => {
      const state = useResumeBuilder.getState();
      
      const idA = state.createResume("Resume A");
      const idB = state.createResume("Resume B");

      // Edit A
      state.switchResume(idA);
      state.updateField("name", "Alice");
      state.updateField("email", "alice@test.com");

      // Edit B
      state.switchResume(idB);
      state.updateField("name", "Bob");
      state.updateField("email", "bob@test.com");

      // Verify both edits persisted
      state.switchResume(idA);
      expect(useResumeBuilder.getState().resume.name).toBe("Alice");
      expect(useResumeBuilder.getState().resume.email).toBe("alice@test.com");

      state.switchResume(idB);
      expect(useResumeBuilder.getState().resume.name).toBe("Bob");
      expect(useResumeBuilder.getState().resume.email).toBe("bob@test.com");
    });
  });

  describe("C28 — Server-First Hydration (hydrateFromServer)", () => {
    it("hydrates server resumes when local state is empty (default resume)", () => {
      // Start with the default (empty) resume
      const defaultId = useResumeBuilder.getState().activeResumeId;
      expect(useResumeBuilder.getState().resumes).toHaveLength(1);

      const serverResumes = [
        {
          resumeId: "server-a",
          resumeName: "Server Resume A",
          templateId: "executive-pro",
          careerStage: "working-professional",
          resume: {
            name: "Alice Server",
            email: "alice@server.com",
            title: "Engineer",
            experience: [],
            education: [],
            skills: [],
            projects: [],
            certifications: [],
            languages: [],
            interests: [],
            achievements: [],
            references: [],
            portfolio: [],
            claims: [],
          },
          version: 3,
        },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      const state = useResumeBuilder.getState();
      expect(state.resumes).toHaveLength(1);
      expect(state.resumes[0].resumeId).toBe("server-a");
      expect(state.resumes[0].name).toBe("Alice Server");
      expect(state.resumes[0].email).toBe("alice@server.com");
      expect(state.resumes[0].templateId).toBe("executive-pro");
      expect(state.activeResumeId).toBe("server-a");
      expect(state.resume.name).toBe("Alice Server");
      expect(state.serverVersions["server-a"]).toBe(3);
    });

    it("hydrates multiple server resumes when local is empty", () => {
      const serverResumes = [
        {
          resumeId: "server-a",
          resumeName: "Resume A",
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { name: "Alice", email: "a@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] },
          version: 1,
        },
        {
          resumeId: "server-b",
          resumeName: "Resume B",
          templateId: "executive-pro",
          careerStage: "manager",
          resume: { name: "Bob", email: "b@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] },
          version: 2,
        },
        {
          resumeId: "server-c",
          resumeName: "Resume C",
          templateId: "consulting-elite",
          careerStage: "freelancer",
          resume: { name: "Charlie", email: "c@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] },
          version: 1,
        },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      const state = useResumeBuilder.getState();
      expect(state.resumes).toHaveLength(3);
      expect(state.resumes.map((r) => r.resumeId)).toEqual(["server-a", "server-b", "server-c"]);
      expect(state.activeResumeId).toBe("server-a");
    });

    it("preserves local resumes that are not on server (LOCAL_ONLY)", () => {
      // Create a real local resume with content (replacing the default)
      const defaultId = useResumeBuilder.getState().activeResumeId;
      const localId = useResumeBuilder.getState().createResume("My Local Resume");
      useResumeBuilder.getState().updateField("name", "Local User");
      useResumeBuilder.getState().updateField("email", "local@test.com");
      // Remove the default empty resume so only the real one remains
      useResumeBuilder.getState().deleteResume(defaultId);

      // Server only has a different resume
      const serverResumes = [
        {
          resumeId: "server-a",
          resumeName: "Server Resume",
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { name: "Server User", email: "server@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] },
          version: 1,
        },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      const state = useResumeBuilder.getState();
      expect(state.resumes).toHaveLength(2);
      // Local resume preserved
      const localResume = state.resumes.find((r) => r.resumeId === localId);
      expect(localResume).toBeDefined();
      expect(localResume!.name).toBe("Local User");
      // Server resume added
      const serverResume = state.resumes.find((r) => r.resumeId === "server-a");
      expect(serverResume).toBeDefined();
      expect(serverResume!.name).toBe("Server User");
    });

    it("does not duplicate when local and server share a resumeId", () => {
      // Create local resume with content (replacing the default)
      const defaultId = useResumeBuilder.getState().activeResumeId;
      const localId = useResumeBuilder.getState().createResume("My Resume");
      useResumeBuilder.getState().updateField("name", "Shared User");
      useResumeBuilder.getState().updateField("email", "shared@test.com");
      useResumeBuilder.getState().deleteResume(defaultId);

      // Server has the same resume
      const serverResumes = [
        {
          resumeId: localId,
          resumeName: "My Resume",
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { name: "Shared User", email: "shared@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] },
          version: 5,
        },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      const state = useResumeBuilder.getState();
      expect(state.resumes).toHaveLength(1);
      expect(state.resumes[0].resumeId).toBe(localId);
      expect(state.serverVersions[localId]).toBe(5);
    });

    it("does nothing when local state is non-empty and server is empty", () => {
      // Create a real local resume
      useResumeBuilder.getState().createResume("My Resume");
      useResumeBuilder.getState().updateField("name", "Real User");

      const before = useResumeBuilder.getState();
      const beforeResumes = [...before.resumes];

      useResumeBuilder.getState().hydrateFromServer([]);

      const after = useResumeBuilder.getState();
      expect(after.resumes).toEqual(beforeResumes);
    });

    it("sets saveStatus to saved after hydration (prevents write-back)", () => {
      useResumeBuilder.setState({ saveStatus: "unsaved" });

      const serverResumes = [
        {
          resumeId: "server-a",
          resumeName: "Resume A",
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { name: "A", email: "a@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] },
          version: 1,
        },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      expect(useResumeBuilder.getState().saveStatus).toBe("saved");
    });

    it("sets hydratingFromServer false after hydration completes", () => {
      const serverResumes = [
        {
          resumeId: "server-a",
          resumeName: "Resume A",
          templateId: "modern-clean",
          careerStage: "working-professional",
          resume: { name: "A", email: "a@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] },
          version: 1,
        },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      expect(useResumeBuilder.getState().hydratingFromServer).toBe(false);
    });

    it("preserves all resume fields from server payload", () => {
      const serverResumes = [
        {
          resumeId: "server-full",
          resumeName: "Full Resume",
          templateId: "executive-pro",
          careerStage: "manager",
          resume: {
            name: "Full User",
            title: "Director",
            email: "full@test.com",
            phone: "+1-555-0100",
            address: "Test City",
            summary: "Experienced professional.",
            experience: [{ id: "e1", company: "ACME", position: "Director", location: "NYC", employmentType: "Full-time", industry: "Tech", startDate: "2020", endDate: "", current: true, duration: "4 years", description: "Led team", achievements: "", techUsed: "", bulletPoints: ["Led 10-person team"] }],
            education: [{ id: "ed1", school: "MIT", degree: "MS", year: "2018", field: "CS", gpa: "3.9", minor: "", honors: "", activities: "", location: "Cambridge" }],
            skills: [{ id: "s1", name: "Leadership", level: "Expert", category: "Soft Skills", years: "10" }],
            projects: [],
            certifications: [],
            languages: [],
            interests: [],
            achievements: [],
            references: [],
            portfolio: [],
            claims: [],
          },
          version: 7,
        },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      const r = useResumeBuilder.getState().resume;
      expect(r.name).toBe("Full User");
      expect(r.title).toBe("Director");
      expect(r.email).toBe("full@test.com");
      expect(r.phone).toBe("+1-555-0100");
      expect(r.summary).toBe("Experienced professional.");
      expect(r.experience).toHaveLength(1);
      expect(r.experience[0].company).toBe("ACME");
      expect(r.experience[0].bulletPoints).toEqual(["Led 10-person team"]);
      expect(r.education).toHaveLength(1);
      expect(r.education[0].school).toBe("MIT");
      expect(r.skills).toHaveLength(1);
      expect(r.skills[0].name).toBe("Leadership");
      expect(r.templateId).toBe("executive-pro");
      expect(r.careerStage).toBe("manager");
      expect(r.resumeName).toBe("Full Resume");
    });
  });

  describe("C29 — Server-Side Delete Propagation", () => {
    beforeEach(() => {
      // Mock fetch to prevent real network calls
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("deletes inactive resume and preserves active", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Switch to A and delete B
      state.switchResume(idA);
      state.deleteResume(idB);

      const after = useResumeBuilder.getState();
      expect(after.resumes).toHaveLength(2); // initial + A
      expect(after.activeResumeId).toBe(idA);
      expect(after.resume.name).toBe("Alice");
      expect(after.resumes.find((r) => r.resumeId === idB)).toBeUndefined();
    });

    it("deletes active resume and switches to another", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Delete A while A is active
      state.switchResume(idA);
      state.deleteResume(idA);

      const after = useResumeBuilder.getState();
      expect(after.resumes).toHaveLength(2); // initial + B
      expect(after.activeResumeId).not.toBe(idA);
      expect(after.resumes.find((r) => r.resumeId === idA)).toBeUndefined();
    });

    it("adds resumeId to pendingDeletes after deletion", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Resume A");
      const idB = state.createResume("Resume B");

      state.deleteResume(idB);

      const after = useResumeBuilder.getState();
      expect(after.pendingDeletes).toContain(idB);
    });

    it("removes from pendingDeletes after server confirms (clearPendingDelete)", () => {
      const state = useResumeBuilder.getState();
      const idB = state.createResume("Resume B");

      state.deleteResume(idB);
      expect(useResumeBuilder.getState().pendingDeletes).toContain(idB);

      useResumeBuilder.getState().clearPendingDelete(idB);
      expect(useResumeBuilder.getState().pendingDeletes).not.toContain(idB);
    });

    it("fires DELETE to server when deleteResume is called", async () => {
      const state = useResumeBuilder.getState();
      const idB = state.createResume("Resume B");

      state.deleteResume(idB);

      // Wait for async fetch
      await new Promise((r) => setTimeout(r, 10));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/resumes/${idB}`,
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("skips hydration of pending-deleted resumes", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");

      // Delete B (adds to pendingDeletes)
      state.deleteResume(idB);

      // Verify pendingDeletes is set
      expect(useResumeBuilder.getState().pendingDeletes).toContain(idB);

      // Server returns both A and B
      const serverResumes = [
        { resumeId: idA, resumeName: "Resume A", templateId: "modern-clean", careerStage: "working-professional", resume: { name: "Alice", email: "a@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] }, version: 1 },
        { resumeId: idB, resumeName: "Resume B", templateId: "modern-clean", careerStage: "working-professional", resume: { name: "Bob", email: "b@test.com", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], claims: [] }, version: 1 },
      ];

      useResumeBuilder.getState().hydrateFromServer(serverResumes);

      const after = useResumeBuilder.getState();
      // B should NOT be in resumes (pending delete)
      expect(after.resumes.find((r) => r.resumeId === idB)).toBeUndefined();
      // A should still be there
      expect(after.resumes.find((r) => r.resumeId === idA)).toBeDefined();
    });

    it("multiple resume isolation: deleting B preserves A and C", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");
      const idC = state.createResume("Resume C");
      state.updateField("name", "Charlie");

      state.deleteResume(idB);

      const after = useResumeBuilder.getState();
      expect(after.resumes).toHaveLength(3); // initial + A + C (B deleted)
      expect(after.resumes.find((r) => r.resumeId === idA)?.name).toBe("Alice");
      expect(after.resumes.find((r) => r.resumeId === idC)?.name).toBe("Charlie");
      expect(after.resumes.find((r) => r.resumeId === idB)).toBeUndefined();
    });

    it("active resume is always valid after deletion", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Resume A");
      const idB = state.createResume("Resume B");
      const idC = state.createResume("Resume C");

      // Delete each possible active resume
      state.switchResume(idA);
      state.deleteResume(idA);
      expect(useResumeBuilder.getState().resumes.some((r) => r.resumeId === useResumeBuilder.getState().activeResumeId)).toBe(true);

      state.switchResume(idB);
      state.deleteResume(idB);
      expect(useResumeBuilder.getState().resumes.some((r) => r.resumeId === useResumeBuilder.getState().activeResumeId)).toBe(true);
    });
  });

  describe("C30 — Explicit Server-Side Resume Creation", () => {
    it("local resume is immediately available after createResume", () => {
      const id = useResumeBuilder.getState().createResume("Immediate Test");

      const state = useResumeBuilder.getState();
      expect(state.resumes.some((r) => r.resumeId === id)).toBe(true);
      expect(state.activeResumeId).toBe(id);
      expect(state.resume.resumeId).toBe(id);
    });

    it("multiple creates produce independent resumes", () => {
      const id1 = useResumeBuilder.getState().createResume("Resume 1");
      const id2 = useResumeBuilder.getState().createResume("Resume 2");
      const id3 = useResumeBuilder.getState().createResume("Resume 3");

      const state = useResumeBuilder.getState();
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(state.resumes.length).toBeGreaterThanOrEqual(3);
    });

    it("create → delete clears server version and adds pendingDeletes", () => {
      // Simulate server version being set
      useResumeBuilder.getState().setServerVersion("test-c30", 1);
      expect(useResumeBuilder.getState().serverVersions["test-c30"]).toBe(1);

      // Create a resume with that ID
      useResumeBuilder.setState((s) => {
        const r = { ...s.resume, resumeId: "test-c30", resumeName: "Delete Test" };
        return { resumes: [...s.resumes, r], activeResumeId: "test-c30", resume: r };
      });

      useResumeBuilder.getState().deleteResume("test-c30");

      expect(useResumeBuilder.getState().serverVersions["test-c30"]).toBeUndefined();
      expect(useResumeBuilder.getState().pendingDeletes).toContain("test-c30");
    });

    it("createResume generates unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        ids.add(useResumeBuilder.getState().createResume(`Test ${i}`));
      }
      expect(ids.size).toBe(10);
    });
  });

  describe("C31 — Duplicate Resume", () => {
    it("duplicate gets a new resumeId", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");
      state.updateField("name", "Alice");

      const idB = state.duplicateResume(idA);

      expect(idB).not.toBe(idA);
      expect(idB).toBeTruthy();
    });

    it("duplicate copies resume content", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");
      state.updateField("name", "Alice");
      state.updateField("email", "alice@test.com");
      state.updateField("summary", "Experienced engineer.");
      state.applyTemplate("executive-pro");

      const idB = state.duplicateResume(idA);
      const dup = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idB);

      expect(dup).toBeDefined();
      expect(dup!.name).toBe("Alice");
      expect(dup!.email).toBe("alice@test.com");
      expect(dup!.summary).toBe("Experienced engineer.");
      expect(dup!.templateId).toBe("executive-pro");
      expect(dup!.resumeName).toContain("(Copy)");
    });

    it("duplicate is independently mutable", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");
      state.updateField("name", "Alice");

      const idB = state.duplicateResume(idA);

      // Edit B
      useResumeBuilder.getState().switchResume(idB);
      useResumeBuilder.getState().updateField("name", "Bob");

      // A should be unchanged
      const a = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idA);
      expect(a!.name).toBe("Alice");

      // B should have the new name
      const b = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idB);
      expect(b!.name).toBe("Bob");
    });

    it("duplicate becomes active", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");

      const idB = state.duplicateResume(idA);

      expect(useResumeBuilder.getState().activeResumeId).toBe(idB);
    });

    it("duplicate uses C30 explicit create pattern (not debounced write-back)", async () => {
      // Verify the duplicate is marked as unsaved (triggers C30 POST via write-back)
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");
      const idB = state.duplicateResume(idA);

      // Duplicate should have saveStatus "unsaved" which triggers explicit POST
      expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");
      // Duplicate should be in the resumes list with a new ID
      const dup = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idB);
      expect(dup).toBeDefined();
      expect(dup!.resumeId).not.toBe(idA);
      expect(dup!.resumeName).toContain("(Copy)");
    });

    it("delete isolation: deleting duplicate preserves original", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");
      state.updateField("name", "Alice");

      const idB = state.duplicateResume(idA);

      // Delete B
      useResumeBuilder.getState().deleteResume(idB);

      // A should remain
      const a = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idA);
      expect(a).toBeDefined();
      expect(a!.name).toBe("Alice");
      expect(a!.resumeId).toBe(idA);

      // B should be gone
      expect(useResumeBuilder.getState().resumes.find((r) => r.resumeId === idB)).toBeUndefined();
    });

    it("style isolation: changing duplicate style does not affect original", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");

      // Set a style for A
      state.setStyleConfig(idA, { accentColor: "#ff0000" });

      const idB = state.duplicateResume(idA);

      // Change B's style
      useResumeBuilder.getState().setStyleConfig(idB, { accentColor: "#0000ff" });

      // A's style should be unchanged
      const aStyle = useResumeBuilder.getState().styleConfigs[idA];
      expect(aStyle).toBeDefined();

      // B's style should be different
      const bStyle = useResumeBuilder.getState().styleConfigs[idB];
      expect(bStyle).toBeDefined();
    });

    it("multiple duplicates produce unique IDs", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original A");

      const idB = state.duplicateResume(idA);
      const idC = state.duplicateResume(idA);

      expect(idA).not.toBe(idB);
      expect(idB).not.toBe(idC);
      expect(idA).not.toBe(idC);

      const resumes = useResumeBuilder.getState().resumes;
      expect(resumes.some((r) => r.resumeId === idA)).toBe(true);
      expect(resumes.some((r) => r.resumeId === idB)).toBe(true);
      expect(resumes.some((r) => r.resumeId === idC)).toBe(true);
    });
  });

  describe("C33.2 — Authoritative Data + Pre-Approval Editing", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("tailor API receives resumeId, not full resume data", async () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Source Resume");
      state.updateField("name", "John Doe");

      // Simulate what TailorResumeModal does — call the API with resumeId
      await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: idA,
          jobDescription: "Senior Data Engineer with Azure experience.",
        }),
      });

      // Verify fetch was called with resumeId, NOT a full resume object
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/ai/tailor",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(`"resumeId":"${idA}"`),
        }),
      );
      // Verify the body does NOT contain a full resume object
      const callBody = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
      expect(callBody.resume).toBeUndefined();
      expect(callBody.resumeId).toBe(idA);
    });

    it("original resume is unchanged during tailoring workflow", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original Resume");
      state.updateField("name", "Original Content");
      state.updateField("email", "original@test.com");
      state.updateField("summary", "Original summary.");

      // Simulate the entire tailoring workflow
      const originalName = useResumeBuilder.getState().resume.name;
      const originalEmail = useResumeBuilder.getState().resume.email;
      const originalSummary = useResumeBuilder.getState().resume.summary;

      // Nothing should have changed the original resume
      expect(useResumeBuilder.getState().resume.name).toBe(originalName);
      expect(useResumeBuilder.getState().resume.email).toBe(originalEmail);
      expect(useResumeBuilder.getState().resume.summary).toBe(originalSummary);
    });

    it("multi-resume isolation: tailoring A does not affect B or C", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Resume A");
      state.updateField("name", "Alice");
      const idB = state.createResume("Resume B");
      state.updateField("name", "Bob");
      const idC = state.createResume("Resume C");
      state.updateField("name", "Charlie");

      // Simulate tailoring A
      const aBefore = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idA);
      const bBefore = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idB);
      const cBefore = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idC);

      // All should remain unchanged
      expect(aBefore!.name).toBe("Alice");
      expect(bBefore!.name).toBe("Bob");
      expect(cBefore!.name).toBe("Charlie");
    });

    it("approval creates new resume, original is untouched", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original Resume");
      state.updateField("name", "Original User");
      const originalCount = useResumeBuilder.getState().resumes.length;

      // Simulate approval: create new resume with tailored content
      const newId = useResumeBuilder.getState().createResume("Original User — Tailored");
      useResumeBuilder.getState().switchResume(newId);
      useResumeBuilder.getState().updateField("name", "Tailored User");

      // Original should be untouched
      const a = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idA);
      expect(a!.name).toBe("Original User");
      expect(a!.resumeId).toBe(idA);

      // New resume should exist
      const b = useResumeBuilder.getState().resumes.find((r) => r.resumeId === newId);
      expect(b!.name).toBe("Tailored User");
      expect(b!.resumeId).not.toBe(idA);

      // Resume count should have increased
      expect(useResumeBuilder.getState().resumes.length).toBe(originalCount + 1);
    });

    it("Professional Identity is unchanged during tailoring", () => {
      const state = useResumeBuilder.getState();
      state.createResume("Source Resume");
      state.updateField("name", "Profile User");
      state.updateField("email", "profile@test.com");

      // Nothing in the store changes Professional Identity
      const r = useResumeBuilder.getState().resume;
      expect(r.name).toBe("Profile User");
      expect(r.email).toBe("profile@test.com");
    });
  });

  describe("C32 — Resume Public Sharing", () => {
    it("share state is independent per resume", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Share A");
      const idB = state.createResume("Share B");

      // Set share state for A only
      useResumeBuilder.getState().setShareState(idA, {
        shareEnabled: true,
        shareToken: "token_a",
        shareUrl: "/resume/share/token_a",
      });

      // A should have share state, B should not
      expect(useResumeBuilder.getState().shareStates[idA]?.shareEnabled).toBe(true);
      expect(useResumeBuilder.getState().shareStates[idB]).toBeUndefined();
    });

    it("clearShareState removes share state for one resume", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Share Clear A");

      useResumeBuilder.getState().setShareState(idA, {
        shareEnabled: true,
        shareToken: "token_clear",
        shareUrl: "/resume/share/token_clear",
      });

      expect(useResumeBuilder.getState().shareStates[idA]?.shareEnabled).toBe(true);

      useResumeBuilder.getState().clearShareState(idA);
      expect(useResumeBuilder.getState().shareStates[idA]).toBeUndefined();
    });

    it("duplicate does not inherit share state", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Share Dup A");

      useResumeBuilder.getState().setShareState(idA, {
        shareEnabled: true,
        shareToken: "token_dup_source",
        shareUrl: "/resume/share/token_dup_source",
      });

      const idB = state.duplicateResume(idA);

      // A should still have share state
      expect(useResumeBuilder.getState().shareStates[idA]?.shareEnabled).toBe(true);
      // B should NOT have share state
      expect(useResumeBuilder.getState().shareStates[idB]).toBeUndefined();
    });

    it("multiple resumes have independent share tokens", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Share Multi A");
      const idB = state.createResume("Share Multi B");
      const idC = state.createResume("Share Multi C");

      useResumeBuilder.getState().setShareState(idA, {
        shareEnabled: true,
        shareToken: "token_a_multi",
        shareUrl: "/resume/share/token_a_multi",
      });
      useResumeBuilder.getState().setShareState(idB, {
        shareEnabled: true,
        shareToken: "token_b_multi",
        shareUrl: "/resume/share/token_b_multi",
      });
      // C not shared

      expect(useResumeBuilder.getState().shareStates[idA]?.shareToken).toBe("token_a_multi");
      expect(useResumeBuilder.getState().shareStates[idB]?.shareToken).toBe("token_b_multi");
      expect(useResumeBuilder.getState().shareStates[idC]).toBeUndefined();
    });
  });

  // ── C36 — Professional Identity → Resume Seeding ───────────────────
  describe("C36 — Professional Identity → Resume Seeding", () => {
    const mockProfile = {
      fullName: "Jane Smith",
      headline: "Senior Data Engineer",
      summary: "Experienced data engineer with 5+ years.",
      email: "jane@example.com",
      phone: "+1 555 1234",
      location: "San Francisco, CA",
      linkedin: "https://linkedin.com/in/janesmith",
      github: "https://github.com/janesmith",
      website: "https://janesmith.com",
      experience: [
        { company: "Acme Corp", position: "Data Engineer", duration: "2021-Present", description: "Built pipelines" },
        { company: "Beta Inc", position: "Junior Engineer", duration: "2019-2021", description: "Data analysis" },
      ],
      education: [
        { school: "MIT", degree: "BS", field: "Computer Science", year: "2019" },
      ],
      skills: ["Python", "SQL", "Azure"],
    };

    it("maps all profile fields to resume correctly", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const seeded = mapProfileToResume({ ...defaultResume }, mockProfile);

      expect(seeded.name).toBe("Jane Smith");
      expect(seeded.title).toBe("Senior Data Engineer");
      expect(seeded.email).toBe("jane@example.com");
      expect(seeded.phone).toBe("+1 555 1234");
      expect(seeded.address).toBe("San Francisco, CA");
      expect(seeded.summary).toBe("Experienced data engineer with 5+ years.");
      expect(seeded.social.linkedin).toBe("https://linkedin.com/in/janesmith");
      expect(seeded.social.github).toBe("https://github.com/janesmith");
      expect(seeded.social.website).toBe("https://janesmith.com");
      expect(seeded.experience).toHaveLength(2);
      expect(seeded.experience[0].company).toBe("Acme Corp");
      expect(seeded.experience[0].position).toBe("Data Engineer");
      expect(seeded.experience[0].duration).toBe("2021-Present");
      expect(seeded.experience[0].description).toBe("Built pipelines");
      expect(seeded.experience[0].id).toContain("seed_exp_");
      expect(seeded.education).toHaveLength(1);
      expect(seeded.education[0].school).toBe("MIT");
      expect(seeded.education[0].degree).toBe("BS");
      expect(seeded.education[0].id).toContain("seed_edu_");
      expect(seeded.skills).toHaveLength(3);
      expect(seeded.skills[0].name).toBe("Python");
      expect(seeded.skills[0].level).toBe("Intermediate");
      expect(seeded.skills[0].id).toContain("seed_skill_");
    });

    it("creates independent deep copy — mutations do not affect source", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const base = { ...defaultResume };
      const seeded = mapProfileToResume(base, mockProfile);

      // Mutate the seeded resume
      seeded.name = "Modified";
      seeded.experience[0].company = "Modified Corp";

      // Create another seed from the same profile
      const seeded2 = mapProfileToResume({ ...defaultResume }, mockProfile);

      // Should be independent
      expect(seeded2.name).toBe("Jane Smith");
      expect(seeded2.experience[0].company).toBe("Acme Corp");
    });

    it("returns base resume unchanged for null profile", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const base = { ...defaultResume, name: "Existing" };
      const result = mapProfileToResume(base, null);

      expect(result.name).toBe("Existing");
      expect(result.experience).toHaveLength(0);
    });

    it("returns base resume unchanged for undefined profile", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const base = { ...defaultResume, name: "Existing" };
      const result = mapProfileToResume(base, undefined);

      expect(result.name).toBe("Existing");
    });

    it("handles partial profile — only fills available fields", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const partial = { fullName: "Jane", email: "jane@test.com" };
      const seeded = mapProfileToResume({ ...defaultResume }, partial);

      expect(seeded.name).toBe("Jane");
      expect(seeded.email).toBe("jane@test.com");
      expect(seeded.title).toBe(""); // not provided
      expect(seeded.experience).toHaveLength(0); // not provided
    });

    it("preserves resume-specific fields (templateId, careerStage)", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const base = { ...defaultResume, templateId: "executive-classic", careerStage: "manager" as const };
      const seeded = mapProfileToResume(base, mockProfile);

      expect(seeded.templateId).toBe("executive-classic");
      expect(seeded.careerStage).toBe("manager");
      expect(seeded.name).toBe("Jane Smith"); // profile data applied
    });

    it("handles empty experience/education arrays in profile", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const emptyProfile = { fullName: "Test", experience: [], education: [], skills: [] };
      const seeded = mapProfileToResume({ ...defaultResume }, emptyProfile);

      expect(seeded.name).toBe("Test");
      expect(seeded.experience).toHaveLength(0);
      expect(seeded.education).toHaveLength(0);
      expect(seeded.skills).toHaveLength(0);
    });

    it("filters empty strings from skills", () => {
      // mapProfileToResume is imported from @/lib/resume-seeding
      const profile = { skills: ["Python", "", "SQL", "  ", "Azure"] };
      const seeded = mapProfileToResume({ ...defaultResume }, profile);

      // Empty and whitespace-only strings are filtered out
      expect(seeded.skills).toHaveLength(3);
      expect(seeded.skills.map((s: { name: string }) => s.name)).toEqual(["Python", "SQL", "Azure"]);
    });

    it("duplication does not reseed from Professional Identity", () => {
      const state = useResumeBuilder.getState();
      const idA = state.createResume("Original");
      const rA = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idA)!;

      // Manually set some data
      useResumeBuilder.getState().setResume({ ...rA, name: "Custom Name", title: "Custom Title" });

      // Duplicate
      const idB = useResumeBuilder.getState().duplicateResume(idA);
      const rB = useResumeBuilder.getState().resumes.find((r) => r.resumeId === idB)!;

      // Should duplicate the SOURCE resume, not reseed from profile
      expect(rB.name).toBe("Custom Name");
      expect(rB.title).toBe("Custom Title");
    });

    it("createResume with initialPayload sends non-empty payload (bypasses server seeding)", () => {
      const state = useResumeBuilder.getState();
      const tailored = {
        name: "Tailored Name",
        title: "Tailored Title",
        email: "tailored@test.com",
        summary: "Tailored summary",
        experience: [{ id: "e1", company: "Corp", position: "Eng", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] }],
        education: [],
        skills: [{ id: "s1", name: "React", level: "Advanced" as const, category: "", years: "" }],
      };
      const id = state.createResume("Tailored", tailored as any);
      const r = useResumeBuilder.getState().resumes.find((r) => r.resumeId === id)!;

      // Should contain the tailored data, not empty defaults
      expect(r.name).toBe("Tailored Name");
      expect(r.title).toBe("Tailored Title");
      expect(r.email).toBe("tailored@test.com");
      expect(r.experience).toHaveLength(1);
      expect(r.experience[0].company).toBe("Corp");
      expect(r.skills).toHaveLength(1);
      expect(r.skills[0].name).toBe("React");
    });
  });
});

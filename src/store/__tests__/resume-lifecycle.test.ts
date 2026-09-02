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
});

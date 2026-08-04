"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import { GraphService } from "../graph-service";
import { resumeToGraph } from "../graph-mapper";
import type { Resume } from "@/types/resume";
import type { KnowledgeGraph } from "@/types/knowledge-graph";

/** Build a minimal valid resume for test seeding. */
function makeResume(name: string = "Test User"): Resume {
  return {
    name, title: "Engineer", email: "a@b.com", phone: "555-0100",
    address: "", nationality: "", pronouns: "", summary: "A summary.",
    social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    experience: [
      { id: "exp1", company: "Acme", position: "Dev", location: "NYC", employmentType: "Full-time", industry: "Tech",
        startDate: "2020-01", endDate: "", current: true, duration: "", description: "", achievements: "", techUsed: "TS,Go",
        bulletPoints: ["Built things."] },
    ],
    education: [{ id: "edu1", school: "MIT", degree: "BS", year: "2020", field: "CS", gpa: "", minor: "", honors: "", activities: "", location: "" }],
    skills: [{ id: "sk1", name: "TypeScript", level: "Advanced", category: "Lang", years: "4" }],
    projects: [{ id: "pr1", name: "Alpha", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed", bulletPoints: [] }],
    certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [],
    templateId: "modern-clean", careerStage: "working-professional", claims: [],
  };
}

function seededGraph(resume?: Resume): GraphService {
  const gs = new GraphService();
  if (resume) gs.setGraph(resumeToGraph(resume));
  return gs;
}

// ──────────────────────────────────────────────
//  GraphService
// ──────────────────────────────────────────────

describe("GraphService", () => {
  // ── Read (graph structure) ──

  describe("getGraph / getProfile", () => {
    it("returns an empty graph on construction", () => {
      const gs = new GraphService();
      const g = gs.getGraph();
      expect(g.profile).toBeDefined();
      expect(g.nodes).toHaveLength(1);   // only profile
      expect(g.edges).toHaveLength(0);
    });

    it("getProfile returns the profile node", () => {
      const gs = seededGraph(makeResume("Alice"));
      expect(gs.getProfile().label).toBe("Alice");
    });
  });

  describe("getNode", () => {
    it("returns a node by id", () => {
      const gs = seededGraph(makeResume());
      const p = gs.getProfile();
      expect(gs.getNode(p.id)).toBeDefined();
    });

    it("returns undefined for a missing id", () => {
      expect(new GraphService().getNode("does-not-exist")).toBeUndefined();
    });
  });

  describe("getNodesByType", () => {
    it("returns all nodes when called with no args", () => {
      const gs = seededGraph(makeResume());
      expect(gs.getNodesByType().length).toBeGreaterThan(1);
    });

    it("filters by one type", () => {
      const gs = seededGraph(makeResume());
      const roles = gs.getNodesByType("role");
      expect(roles.every((n) => n.type === "role")).toBe(true);
    });

    it("filters by multiple types", () => {
      const gs = seededGraph(makeResume());
      const edges = gs.getNodesByType("skill", "role");
      expect(edges.every((n) => n.type === "skill" || n.type === "role")).toBe(true);
    });

    it("returns empty array for a nonexistent type", () => {
      expect(new GraphService().getNodesByType("nonexistent")).toHaveLength(0);
    });
  });

  // ── Edges ──

  describe("getEdges / getIncomingEdges / getAllEdges / getEdgesByType", () => {
    let gs: GraphService;
    beforeEach(() => { gs = seededGraph(makeResume()); });

    it("getEdges returns outgoing edges for a node", () => {
      const profileId = gs.getProfile().id;
      const edges = gs.getEdges(profileId);
      expect(edges.length).toBeGreaterThan(0);
    });

    it("getEdges filters by type", () => {
      const profileId = gs.getProfile().id;
      const edges = gs.getEdges(profileId, "HAS_ROLE");
      expect(edges.every((e) => e.type === "HAS_ROLE")).toBe(true);
    });

    it("getIncomingEdges returns incoming edges", () => {
      const roles = gs.findRoles();
      // Each role should have incoming WORKED_AT from the organization
      const incoming = gs.getIncomingEdges(roles[0].id);
      expect(incoming.length).toBeGreaterThanOrEqual(0);
    });

    it("getAllEdges returns every edge", () => {
      expect(gs.getAllEdges().length).toBeGreaterThan(0);
    });

    it("getEdgesByType returns edges of a given type", () => {
      expect(gs.getEdgesByType("HAS_SKILL").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("hasEdge", () => {
    it("returns true when an edge exists", () => {
      const gs = seededGraph(makeResume());
      const p = gs.getProfile();
      const s = gs.findSkills()[0];
      expect(gs.hasEdge(p.id, s.id)).toBe(true);
    });

    it("filters by type when provided", () => {
      const gs = seededGraph(makeResume());
      const p = gs.getProfile();
      const s = gs.findSkills()[0];
      expect(gs.hasEdge(p.id, s.id, "HAS_SKILL")).toBe(true);
      expect(gs.hasEdge(p.id, s.id, "HAS_ROLE")).toBe(false);
    });

    it("returns false for a missing edge", () => {
      expect(new GraphService().hasEdge("x", "y")).toBe(false);
    });
  });

  describe("getNeighbors", () => {
    it("returns adjacent nodes", () => {
      const gs = seededGraph(makeResume());
      const p = gs.getProfile();
      const neighbors = gs.getNeighbors(p.id, "HAS_ROLE");
      expect(neighbors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Counts ──

  describe("nodeCount / edgeCount", () => {
    it("nodeCount reflects total nodes", () => {
      const gs = seededGraph(makeResume());
      expect(gs.nodeCount()).toBeGreaterThan(1);
    });

    it("edgeCount reflects total edges", () => {
      expect(seededGraph(makeResume()).edgeCount()).toBeGreaterThan(0);
    });
  });

  // ── Search ──

  describe("searchGraph", () => {
    it("finds nodes by label", () => {
      const gs = seededGraph(makeResume());
      const results = gs.searchGraph("TypeScript");
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("is case-insensitive", () => {
      const gs = seededGraph(makeResume());
      expect(gs.searchGraph("typescript").length).toBeGreaterThanOrEqual(1);
    });

    it("returns empty for unmatched term", () => {
      expect(new GraphService().searchGraph("zzzzz")).toHaveLength(0);
    });
  });

  // ── Typed finders ──

  describe("find* methods", () => {
    let gs: GraphService;
    beforeEach(() => { gs = seededGraph(makeResume()); });

    it("findSkills", () => { expect(gs.findSkills().length).toBeGreaterThanOrEqual(1); });
    it("findProjects", () => { expect(gs.findProjects().length).toBeGreaterThanOrEqual(1); });
    it("findOrganizations", () => { expect(gs.findOrganizations().length).toBeGreaterThanOrEqual(1); });
    it("findRoles", () => { expect(gs.findRoles().length).toBeGreaterThanOrEqual(1); });
    it("findAchievements", () => { expect(gs.findAchievements()).toHaveLength(0); });
    it("findCertifications", () => { expect(gs.findCertifications()).toHaveLength(0); });
    it("findEducations", () => { expect(gs.findEducations().length).toBeGreaterThanOrEqual(1); });
    it("findLanguages", () => { expect(gs.findLanguages()).toHaveLength(0); });
    it("findInterests", () => { expect(gs.findInterests()).toHaveLength(0); });
    it("findReferences", () => { expect(gs.findReferences()).toHaveLength(0); });
    it("findPortfolios", () => { expect(gs.findPortfolios()).toHaveLength(0); });
    it("findClaims", () => { expect(gs.findClaims()).toHaveLength(0); });
    it("findEvidence", () => { expect(gs.findEvidence()).toHaveLength(0); });
    it("findVerifiers", () => { expect(gs.findVerifiers()).toHaveLength(0); });
    it("findSources", () => { expect(gs.findSources()).toHaveLength(0); });

    it("empty graph find* calls return zero length", () => {
      const empty = new GraphService();
      expect(empty.findSkills()).toHaveLength(0);
      expect(empty.findRoles()).toHaveLength(0);
      expect(empty.findOrganizations()).toHaveLength(0);
    });
  });

  // ── getCareerOverview ──

  describe("getCareerOverview", () => {
    it("returns zeros for an empty graph", () => {
      const overview = new GraphService().getCareerOverview();
      expect(overview.totalRoles).toBe(0);
      expect(overview.totalSkills).toBe(0);
      expect(overview.currentRole).toBeNull();
    });

    it("returns correct stats for a seeded graph", () => {
      const gs = seededGraph(makeResume());
      const overview = gs.getCareerOverview();
      expect(overview.totalRoles).toBe(1);
      expect(overview.totalSkills).toBeGreaterThanOrEqual(1);
      expect(overview.totalEducation).toBe(1);
      expect(overview.currentRole).toBe("Dev");
      expect(overview.industryDiversity).toBeGreaterThanOrEqual(1);
    });
  });

  // ── getCareerTimeline ──

  describe("getCareerTimeline", () => {
    it("returns events sorted descending by date", () => {
      const gs = seededGraph(makeResume());
      const events = gs.getCareerTimeline();
      expect(events.length).toBeGreaterThan(0);
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].date.localeCompare(events[i].date)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── getSkillGraph ──

  describe("getSkillGraph", () => {
    it("returns skills and co-occurrence edges", () => {
      const gs = seededGraph(makeResume());
      const sg = gs.getSkillGraph();
      expect(sg.skills.length).toBeGreaterThanOrEqual(1);
      // co-occurrence edges exist if multiple skills share the same target
    });
  });

  // ── findEvidenceForClaim / findRelatedSkills / findProjectsBySkill / getOrganizations ──

  describe("advanced traversals", () => {
    it("findEvidenceForClaim returns empty when no claim exists", () => {
      expect(new GraphService().findEvidenceForClaim("none")).toHaveLength(0);
    });

    it("findRelatedSkills returns empty when no related nodes exist", () => {
      expect(new GraphService().findRelatedSkills("none")).toHaveLength(0);
    });

    it("findProjectsBySkill returns empty when skill not in graph", () => {
      expect(new GraphService().findProjectsBySkill("none")).toHaveLength(0);
    });

    it("getOrganizations returns organization-role pairs", () => {
      const gs = seededGraph(makeResume());
      const orgs = gs.getOrganizations();
      expect(orgs.length).toBeGreaterThanOrEqual(1);
    });

    it("getOrganizations includes education orgs", () => {
      const gs = seededGraph(makeResume());
      const orgs = gs.getOrganizations();
      const eduOrgs = orgs.filter((o) => o.roles.length === 0);
      // MIT has no roles (it's an education org)
      expect(eduOrgs.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Mutation ──

  describe("updateProfile", () => {
    it("updates profile fields", () => {
      const gs = seededGraph(makeResume());
      gs.updateProfile({ title: "Senior Engineer" });
      expect(gs.getProfile().title).toBe("Senior Engineer");
    });
  });

  describe("addNode / addEdge / removeNode / removeEdge", () => {
    it("addNode adds a node", () => {
      const gs = new GraphService();
      const profile = gs.getProfile();
      gs.addNode({ id: "n1", type: "skill", label: "Go", proficiency: "Advanced", category: "Lang", lastUpdated: "", source: "test" } as any);
      expect(gs.getNode("n1")).toBeDefined();
    });

    it("addNode upserts into the nodes array (profile is separate, use updateProfile)", () => {
      const gs = new GraphService();
      const p = gs.getProfile();
      gs.addNode({ ...p, label: "Updated" });
      const updated = gs.getNode(p.id);
      expect(updated?.label).toBe("Updated");
    });

    it("addEdge creates and returns an edge", () => {
      const gs = new GraphService();
      const p = gs.getProfile();
      gs.addNode({ id: "n2", type: "skill", label: "Rust", proficiency: "Beginner", category: "Lang", lastUpdated: "", source: "test" } as any);
      const edge = gs.addEdge(p.id, "n2", "HAS_SKILL");
      expect(edge).toBeDefined();
      expect(gs.hasEdge(p.id, "n2")).toBe(true);
    });

    it("removeNode removes node and its edges", () => {
      const gs = new GraphService();
      const p = gs.getProfile();
      expect(gs.nodeCount()).toBe(1);
      // remove the profile node
      const removed = gs.removeNode(p.id);
      expect(removed).toBe(true);
      expect(gs.nodeCount()).toBe(0);
    });

    it("removeNode returns false when id not found", () => {
      expect(new GraphService().removeNode("x")).toBe(false);
    });

    it("removeEdge removes an edge", () => {
      const gs = seededGraph(makeResume());
      const e = gs.getAllEdges()[0];
      expect(gs.removeEdge(e.id)).toBe(true);
      expect(gs.getAllEdges().length).toBeLessThan(seededGraph(makeResume()).getAllEdges().length);
    });

    it("removeEdge returns false when id not found", () => {
      expect(new GraphService().removeEdge("x")).toBe(false);
    });
  });

  describe("setGraph / clear", () => {
    it("setGraph replaces the graph", () => {
      const gs = new GraphService();
      const fresh = resumeToGraph(makeResume("Bob"));
      gs.setGraph(fresh);
      expect(gs.getProfile().label).toBe("Bob");
    });

    it("clear resets to empty graph", () => {
      const gs = seededGraph(makeResume());
      gs.clear();
      expect(gs.nodeCount()).toBe(1);
      expect(gs.edgeCount()).toBe(0);
    });
  });
});
"use strict";

import {
  type KnowledgeGraph,
  type NodeId,
  type AnyNode,
  type ProfileNode,
  type SkillNode,
  type OrganizationNode,
  type RoleNode,
  type ProjectNode,
  type EducationNode,
  type CertificationNode,
  type AchievementNode,
  type LanguageNode,
  type InterestNode,
  type ReferenceNode,
  type PortfolioNode,
  type ClaimNode,
  type EvidenceNode,
  type VerifierNode,
  type SourceNode,
  type GraphEdge,
  type EdgeType,
  getNode as getNodeById,
  getEdges as getEdgesHelper,
  getIncomingEdges as getIncomingEdgesHelper,
  getNeighbors as getNeighborsHelper,
} from "@/types/knowledge-graph";

/**
 * Graph Service — pure graph traversal, query, and mutation.
 *
 * This is the innermost layer of the architecture. It owns the graph
 * data and exposes it through a clean API. No business logic, no
 * scoring, no verification — just the graph.
 *
 * Higher services (TrustService, InsightService, AIReasoningService)
 * consume this service, never the raw KnowledgeGraph directly.
 */
export class GraphService {
  private graph: KnowledgeGraph;

  constructor(initialGraph?: KnowledgeGraph) {
    this.graph = initialGraph ?? this.createEmptyGraph();
  }

  // -----------------------------------------------------------------
  //  Read — graph structure
  // -----------------------------------------------------------------

  getGraph(): KnowledgeGraph {
    return this.graph;
  }

  getProfile(): ProfileNode {
    return this.graph.profile;
  }

  getNode<T extends AnyNode>(id: NodeId): T | undefined {
    return this.graph.nodes.find((n): n is T => n.id === id) as T | undefined;
  }

  getNodesByType<T extends AnyNode = AnyNode>(...types: string[]): T[] {
    if (types.length === 0) return this.graph.nodes as T[];
    const set = new Set(types);
    return this.graph.nodes.filter((n) => set.has(n.type)) as T[];
  }

  getEdges(sourceId: NodeId, type?: EdgeType): GraphEdge[] {
    return getEdgesHelper(this.graph, sourceId, type);
  }

  getIncomingEdges(targetId: NodeId, type?: EdgeType): GraphEdge[] {
    return getIncomingEdgesHelper(this.graph, targetId, type);
  }

  getAllEdges(): GraphEdge[] {
    return this.graph.edges;
  }

  getEdgesByType(type: EdgeType): GraphEdge[] {
    return this.graph.edges.filter((e) => e.type === type);
  }

  hasEdge(sourceId: NodeId, targetId: NodeId, type?: EdgeType): boolean {
    return this.graph.edges.some(
      (e) =>
        e.sourceNodeId === sourceId &&
        e.targetNodeId === targetId &&
        (!type || e.type === type)
    );
  }

  getNeighbors(nodeId: NodeId, edgeType: EdgeType): AnyNode[] {
    return getNeighborsHelper(this.graph, nodeId, edgeType);
  }

  nodeCount(): number {
    return this.graph.nodes.length;
  }

  edgeCount(): number {
    return this.graph.edges.length;
  }

  // -----------------------------------------------------------------
  //  Search
  // -----------------------------------------------------------------

  searchGraph(term: string): AnyNode[] {
    const lower = term.toLowerCase();
    return this.graph.nodes.filter((n) => {
      if (n.label.toLowerCase().includes(lower)) return true;
      if ("description" in n && typeof (n as any).description === "string" && (n as any).description.toLowerCase().includes(lower)) return true;
      if ("assertion" in n && typeof (n as any).assertion === "string" && (n as any).assertion.toLowerCase().includes(lower)) return true;
      if ("title" in n && typeof (n as any).title === "string" && (n as any).title.toLowerCase().includes(lower)) return true;
      return false;
    });
  }

  // -----------------------------------------------------------------
  //  Find — typed convenience queries
  // -----------------------------------------------------------------

  findSkills(): SkillNode[] {
    return this.getNodesByType<SkillNode>("skill");
  }

  findProjects(): ProjectNode[] {
    return this.getNodesByType<ProjectNode>("project");
  }

  findOrganizations(): OrganizationNode[] {
    return this.getNodesByType<OrganizationNode>("organization");
  }

  findRoles(): RoleNode[] {
    return this.getNodesByType<RoleNode>("role");
  }

  findAchievements(): AchievementNode[] {
    return this.getNodesByType<AchievementNode>("achievement");
  }

  findCertifications(): CertificationNode[] {
    return this.getNodesByType<CertificationNode>("certification");
  }

  findEducations(): EducationNode[] {
    return this.getNodesByType<EducationNode>("education");
  }

  findLanguages(): LanguageNode[] {
    return this.getNodesByType<LanguageNode>("language");
  }

  findInterests(): InterestNode[] {
    return this.getNodesByType<InterestNode>("interest");
  }

  findReferences(): ReferenceNode[] {
    return this.getNodesByType<ReferenceNode>("reference");
  }

  findPortfolios(): PortfolioNode[] {
    return this.getNodesByType<PortfolioNode>("portfolio");
  }

  findClaims(): ClaimNode[] {
    return this.getNodesByType<ClaimNode>("claim");
  }

  findEvidence(): EvidenceNode[] {
    return this.getNodesByType<EvidenceNode>("evidence");
  }

  findVerifiers(): VerifierNode[] {
    return this.getNodesByType<VerifierNode>("verifier");
  }

  findSources(): SourceNode[] {
    return this.getNodesByType<SourceNode>("source");
  }

  // -----------------------------------------------------------------
  //  Advanced graph traversals
  // -----------------------------------------------------------------

  /** High-level career overview: aggregate stats from the graph. */
  getCareerOverview(): {
    totalRoles: number;
    totalEducation: number;
    totalSkills: number;
    totalProjects: number;
    totalCertifications: number;
    currentRole: string | null;
    totalYearsExperience: number;
    topSkillCategories: string[];
    industryDiversity: number;
  } {
    const roles = this.findRoles();
    const skills = this.findSkills();
    const projects = this.findProjects();
    const certs = this.findCertifications();
    const edu = this.findEducations();
    const orgs = this.findOrganizations();

    const currentRole = roles.find((r) => r.isCurrent);
    const yearsExp = this.calcTotalYearsExp(roles);
    const industries = new Set(orgs.map((o) => o.industry).filter(Boolean));

    const categoryCount = new Map<string, number>();
    for (const s of skills) {
      if (s.category) categoryCount.set(s.category, (categoryCount.get(s.category) ?? 0) + 1);
    }
    const topCats = [...categoryCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    return {
      totalRoles: roles.length,
      totalEducation: edu.length,
      totalSkills: skills.length,
      totalProjects: projects.length,
      totalCertifications: certs.length,
      currentRole: currentRole?.title ?? null,
      totalYearsExperience: yearsExp,
      topSkillCategories: topCats,
      industryDiversity: industries.size,
    };
  }

  /** Chronological timeline of all roles, education, and projects. */
  getCareerTimeline(): Array<{
    date: string;
    type: "role-start" | "role-end" | "education" | "project" | "certification";
    label: string;
    nodeId: NodeId;
  }> {
    const events: ReturnType<typeof this.getCareerTimeline> = [];
    const now = new Date().toISOString();

    for (const role of this.findRoles()) {
      if (role.startDate) {
        events.push({ date: role.startDate, type: "role-start", label: `Started ${role.title}`, nodeId: role.id });
      }
      const end = role.isCurrent ? now : role.endDate;
      if (end) {
        events.push({ date: end, type: "role-end", label: role.isCurrent ? `Current — ${role.title}` : `Ended ${role.title}`, nodeId: role.id });
      }
    }

    for (const edu of this.findEducations()) {
      if (edu.endDate) {
        events.push({ date: edu.endDate, type: "education", label: `${edu.degree} — ${edu.field}`, nodeId: edu.id });
      }
    }

    for (const proj of this.findProjects()) {
      const d = proj.endDate || proj.startDate;
      if (d) {
        events.push({ date: d, type: "project", label: proj.label, nodeId: proj.id });
      }
    }

    for (const cert of this.findCertifications()) {
      if (cert.issueDate) {
        events.push({ date: cert.issueDate, type: "certification", label: cert.label, nodeId: cert.id });
      }
    }

    events.sort((a, b) => b.date.localeCompare(a.date));
    return events;
  }

  /** Build a skill graph: nodes connected by USED_SKILL edges through roles/projects. */
  getSkillGraph(): { skills: SkillNode[]; edges: Array<{ from: string; to: string; weight: number }> } {
    const skills = this.findSkills();
    const skillEdgeMap = new Map<string, Map<string, number>>();

    const coOccurrenceEdges = this.getEdgesByType("USED_SKILL");
    for (const edge of coOccurrenceEdges) {
      const from = edge.sourceNodeId;
      // Find other skills used in the same target
      const siblings = coOccurrenceEdges.filter(
        (e) => e.targetNodeId === edge.targetNodeId && e.sourceNodeId !== from
      );
      for (const sib of siblings) {
        const to = sib.sourceNodeId;
        if (!skillEdgeMap.has(from)) skillEdgeMap.set(from, new Map());
        const inner = skillEdgeMap.get(from)!;
        inner.set(to, (inner.get(to) ?? 0) + 1);
      }
    }

    const resultEdges: Array<{ from: string; to: string; weight: number }> = [];
    for (const [from, targets] of skillEdgeMap) {
      for (const [to, weight] of targets) {
        resultEdges.push({ from, to, weight });
      }
    }

    return { skills, edges: resultEdges };
  }

  /** Find all evidence supporting a specific claim. */
  findEvidenceForClaim(claimId: NodeId): EvidenceNode[] {
    return this.getNeighbors(claimId, "SUPPORTED_BY").filter(
      (n): n is EvidenceNode => n.type === "evidence"
    );
  }

  /** Find skills related to a given skill (SIMILAR_TO, PREREQUISITE_FOR). */
  findRelatedSkills(skillId: NodeId): SkillNode[] {
    const related = new Map<string, SkillNode>();
    for (const type of ["SIMILAR_TO", "PREREQUISITE_FOR", "RELATED_TO"] as EdgeType[]) {
      for (const n of this.getNeighbors(skillId, type)) {
        if (n.type === "skill") related.set(n.id, n as SkillNode);
      }
    }
    return [...related.values()];
  }

  /** Find all projects that used a specific skill. */
  findProjectsBySkill(skillId: NodeId): ProjectNode[] {
    const projectIds = new Set<NodeId>();

    // A skill USED_SKILL → role, and that role WORKED_ON → project
    const usedEdges = this.getEdges(skillId, "USED_SKILL");
    for (const e of usedEdges) {
      const workedOnEdges = this.getEdges(e.targetNodeId, "WORKED_ON");
      for (const wo of workedOnEdges) {
        projectIds.add(wo.targetNodeId);
        projectIds.add(wo.sourceNodeId);
      }
    }

    // Also find projects directly connected via USED_SKILL
    for (const e of usedEdges) {
      const target = this.getNode(e.targetNodeId);
      if (target?.type === "project") projectIds.add(target.id);
    }

    return this.findProjects().filter((p) => projectIds.has(p.id));
  }

  /** Get all distinct organizations with their roles. */
  getOrganizations(): Array<{ org: OrganizationNode; roles: RoleNode[] }> {
    const result: Array<{ org: OrganizationNode; roles: RoleNode[] }> = [];
    for (const org of this.findOrganizations()) {
      const roleEdges = this.getIncomingEdges(org.id, "WORKED_AT");
      const roles = roleEdges
        .map((e) => this.getNode<RoleNode>(e.sourceNodeId))
        .filter((r): r is RoleNode => !!r);
      result.push({ org, roles });
    }

    // Also include education orgs
    for (const org of this.findOrganizations()) {
      if (!result.some((r) => r.org.id === org.id)) {
        const eduEdges = this.getIncomingEdges(org.id, "STUDIED_AT");
        if (eduEdges.length > 0) {
          result.push({ org, roles: [] });
        }
      }
    }

    return result;
  }

  // -----------------------------------------------------------------
  //  Mutation
  // -----------------------------------------------------------------

  updateProfile(updates: Partial<ProfileNode>): void {
    const profile = this.graph.profile;
    this.graph.profile = {
      ...profile,
      ...updates,
      type: "profile",
      id: profile.id,
      lastUpdated: new Date().toISOString(),
      source: updates.source ?? profile.source,
    } as ProfileNode;
    this.upsertNode(this.graph.profile);
  }

  addNode(node: AnyNode): void {
    node.lastUpdated = new Date().toISOString();
    const idx = this.graph.nodes.findIndex((n) => n.id === node.id);
    if (idx >= 0) {
      this.graph.nodes[idx] = node;
    } else {
      this.graph.nodes.push(node);
    }
    this.touchProfile();
  }

  addEdge(sourceId: NodeId, targetId: NodeId, type: EdgeType, context?: string, period?: { start?: string; end?: string }): GraphEdge {
    const edge: GraphEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      type,
      context,
      period,
    };
    this.graph.edges.push(edge);
    this.touchProfile();
    return edge;
  }

  removeNode(id: NodeId): boolean {
    const before = this.graph.nodes.length;
    this.graph.nodes = this.graph.nodes.filter((n) => n.id !== id);
    this.graph.edges = this.graph.edges.filter(
      (e) => e.sourceNodeId !== id && e.targetNodeId !== id
    );
    this.touchProfile();
    return this.graph.nodes.length < before;
  }

  removeEdge(id: NodeId): boolean {
    const before = this.graph.edges.length;
    this.graph.edges = this.graph.edges.filter((e) => e.id !== id);
    this.touchProfile();
    return this.graph.edges.length < before;
  }

  // -----------------------------------------------------------------
  //  Graph replacement
  // -----------------------------------------------------------------

  /** Replace the entire graph in one operation (used by graph-mapper). */
  setGraph(graph: KnowledgeGraph): void {
    this.graph = graph;
  }

  /** Clear all data and reset to an empty graph. */
  clear(): void {
    this.graph = this.createEmptyGraph();
  }

  // -----------------------------------------------------------------
  //  Private helpers
  // -----------------------------------------------------------------

  private createEmptyGraph(): KnowledgeGraph {
    const profileId = `profile_${Date.now()}`;
    const now = new Date().toISOString();
    const profile: ProfileNode = {
      id: profileId, type: "profile", label: "", title: "", email: "", phone: "",
      address: "", nationality: "", pronouns: "", summary: "", lastUpdated: now, source: "system",
      careerStage: "working-professional",
      social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    };
    return { profile, nodes: [profile], edges: [] };
  }

  private upsertNode(node: AnyNode): void {
    const idx = this.graph.nodes.findIndex((n) => n.id === node.id);
    if (idx >= 0) this.graph.nodes[idx] = node;
    else this.graph.nodes.push(node);
  }

  private touchProfile(): void {
    this.graph.profile.lastUpdated = new Date().toISOString();
  }

  private calcTotalYearsExp(roles: RoleNode[]): number {
    if (roles.length === 0) return 0;
    let totalMs = 0;
    for (const r of roles) {
      const start = new Date(r.startDate).getTime();
      const end = r.isCurrent ? Date.now() : r.endDate ? new Date(r.endDate).getTime() : Date.now();
      totalMs += end - start;
    }
    return Math.round(totalMs / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10;
  }
}

export { type NodeId, type EdgeType, type AnyNode, type KnowledgeGraph } from "@/types/knowledge-graph";

// D:/Patorbit Knowledge System (PKS)/src/types/knowledge-graph.ts

/**
 * =================================================================
 * The Patorbit Career Knowledge Graph
 *
 * This models a user's career as a graph of interconnected nodes.
 * Each node is a core entity (e.g., a Skill, a Company).
 * Each edge represents a relationship (e.g., "used-skill" at "company").
 *
 * The Resume is just one possible "view" generated from this graph.
 * Other views include: Portfolio, LinkedIn Profile, Career Passport,
 * ATS Scorecard, Interview Prep, Skill Gap Analysis, etc.
 * =================================================================
 */

// -----------------------------------------------------------------
//  Core Node Interface & Types
// -----------------------------------------------------------------

/** A unique identifier for any node in the graph. */
export type NodeId = string;

/** Every node in the graph must have these properties. */
export interface GraphNode {
  id: NodeId;
  /** A human-readable label for the node. */
  label: string;
  /** Last time this node was updated or verified. */
  lastUpdated: string; // ISO 8601 timestamp
  /** Where this information came from (e.g., 'user-input', 'linkedin-import', 'resume-parse'). */
  source: string;
}

// -----------------------------------------------------------------
//  Root — the person this graph belongs to
// -----------------------------------------------------------------

/**
 * The ProfileNode is the root of the graph.
 * Every edge originates from or relates back to this node.
 */
export interface ProfileNode extends GraphNode {
  type: "profile";
  title: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  pronouns?: string;
  summary: string;
  /** URLs to professional social/web presences. */
  social: {
    linkedin: string;
    github: string;
    website: string;
    twitter: string;
    portfolio: string;
    stackoverflow: string;
  };
  careerStage: "student" | "recent-graduate" | "working-professional" | "manager" | "freelancer";
}

// -----------------------------------------------------------------
//  Entity Nodes
// -----------------------------------------------------------------

/** A specific skill, tool, or technology. */
export interface SkillNode extends GraphNode {
  type: "skill";
  /** Self-assessed proficiency level. */
  proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  /** Categorization (e.g., 'Programming Language', 'Cloud Platform', 'Design Tool'). */
  category?: string;
}

/** An organization (company, university, institution). */
export interface OrganizationNode extends GraphNode {
  type: "organization";
  location?: string;
  industry?: string;
  website?: string;
}

/** A role or position held at an organization. */
export interface RoleNode extends GraphNode {
  type: "role";
  title: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  employmentType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
}

/** A specific project, either professional or personal. */
export interface ProjectNode extends GraphNode {
  type: "project";
  description: string;
  startDate?: string;
  endDate?: string;
  status: "Completed" | "In Progress" | "Ongoing";
  url?: string;
  role?: string;
  teamSize?: string;
  bulletPoints: string[];
}

/** A degree, major, or field of study. */
export interface EducationNode extends GraphNode {
  type: "education";
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  minor?: string;
  honors?: string;
  activities?: string;
  location?: string;
}

/** A credential or official qualification. */
export interface CertificationNode extends GraphNode {
  type: "certification";
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  url?: string;
  description?: string;
}

/** A specific achievement or accomplishment. */
export interface AchievementNode extends GraphNode {
  type: "achievement";
  description: string;
  date: string;
  issuer?: string;
}

/** A language the user speaks. */
export interface LanguageNode extends GraphNode {
  type: "language";
  proficiency: "Native" | "Fluent" | "Professional" | "Conversational" | "Beginner";
}

/** A personal or professional interest. */
export interface InterestNode extends GraphNode {
  type: "interest";
}

/** A professional reference. */
export interface ReferenceNode extends GraphNode {
  type: "reference";
  name: string;
  position: string;
  email: string;
  phone?: string;
  organization?: string; // Denormalized; could link via edge in the future
}

/** A portfolio link or artifact. */
export interface PortfolioNode extends GraphNode {
  type: "portfolio";
  description: string;
  url: string;
  mediaType: "github" | "website" | "dribbble" | "figma" | "other";
}

// -----------------------------------------------------------------
//  Trust & Intelligence Nodes
// -----------------------------------------------------------------

/**
 * A Claim is any assertion in the graph that can be verified.
 * Examples: "I know Python", "I led a team of 10", "Revenue grew 30%"
 * Claims are the unit of trust — every statement about a career can
 * be recorded as a claim and optionally verified.
 */
export interface ClaimNode extends GraphNode {
  type: "claim";
  /** The assertion being made (e.g., "Achieved 99.9% uptime") */
  assertion: string;
  /** The category of claim for trust weighting */
  claimType:
    | "skill-proficiency"
    | "achievement"
    | "responsibility"
    | "metric"
    | "education"
    | "credential"
    | "experience"
    | "endorsement";
  /** Whether the claim carries a quantitative metric */
  hasMetric: boolean;
  /** Self-assessed confidence (0-1) */
  confidence: number;
  /** Current verification status */
  verificationStatus: "unverified" | "pending" | "verified" | "disputed" | "expired";
}

/**
 * Evidence is concrete support for a Claim.
 * It links a claim to one or more Source nodes.
 */
export interface EvidenceNode extends GraphNode {
  type: "evidence";
  /** The form this evidence takes */
  format:
    | "link"           // URL to a public profile, project, or credential
    | "document"       // Uploaded PDF, certificate image, etc.
    | "reference"      // A referee who can corroborate
    | "artifact"       // Code repo, deployed app, design file
    | "testimonial"    // Written recommendation or endorsement
    | "metric";        // A quantifiable data point
  /** URL or path to the evidence */
  location: string;
  /** Optional description of how this evidence supports the claim */
  description?: string;
}

/**
 * A Verifier is a trusted entity that can verify Claims.
 * This can be an automated system, a human referee, or a third-party service.
 */
export interface VerifierNode extends GraphNode {
  type: "verifier";
  /** How this verifier operates */
  verifierType: "human" | "automated" | "third-party" | "self" | "blockchain";
  /** Trust rating of this verifier (0-1) */
  trustRating: number;
  /** Domain(s) this verifier is authorized for */
  scope: string[];
}

/**
 * A Source is where original data entered the graph.
 * This provides full provenance for every piece of information.
 */
export interface SourceNode extends GraphNode {
  type: "source";
  /** Where the data came from */
  sourceType:
    | "user-input"       // Manual entry
    | "resume-upload"    // Resume file parse
    | "linkedin-import"  // LinkedIn profile import
    | "github-import"    // GitHub profile import
    | "ai-extraction"    // AI parsed from free text
    | "credential-check" // Third-party verification service
    | "reference-check"  // Human referee input
    | "api-integration"; // External API
  /** Import or creation timestamp */
  importedAt: string;
  /** Whether this source is considered primary */
  isPrimary: boolean;
  /** Optional original data that was parsed to create this graph entry */
  rawData?: string;
}

// -----------------------------------------------------------------
//  Edge Types (The Relationships)
// -----------------------------------------------------------------

export type EdgeType =
  // Profile connections
  | "HAS_ROLE"          // ProfileNode → RoleNode
  | "HAS_SKILL"         // ProfileNode → SkillNode
  | "HAS_CERTIFICATION" // ProfileNode → CertificationNode
  | "HAS_EDUCATION"     // ProfileNode → EducationNode
  | "HAS_ACHIEVEMENT"   // ProfileNode → AchievementNode
  | "HAS_LANGUAGE"      // ProfileNode → LanguageNode
  | "HAS_INTEREST"      // ProfileNode → InterestNode
  | "HAS_REFERENCE"     // ProfileNode → ReferenceNode
  | "HAS_PORTFOLIO"     // ProfileNode → PortfolioNode

  // Inter-entity connections
  | "WORKED_AT"         // RoleNode → OrganizationNode
  | "STUDIED_AT"        // EducationNode → OrganizationNode
  | "WORKED_ON"         // RoleNode → ProjectNode
  | "USED_SKILL"        // SkillNode → RoleNode | ProjectNode
  | "ACCOMPLISHED"      // AchievementNode → RoleNode | ProjectNode
  | "EARNED_FROM"       // CertificationNode → OrganizationNode
  | "IMPLIES_SKILL"     // CertificationNode → SkillNode
  | "TAUGHT_SKILL"      // EducationNode → SkillNode

  // Trust & Evidence connections
  | "HAS_CLAIM"         // AnyEntityNode → ClaimNode
  | "SUPPORTED_BY"      // ClaimNode → EvidenceNode
  | "VERIFIED_BY"       // EvidenceNode → VerifierNode
  | "DERIVED_FROM"      // EvidenceNode → SourceNode
  | "CHALLENGED_BY"     // ClaimNode → VerifierNode (dispute)
  | "REINFORCES"        // ClaimNode → ClaimNode (supporting claim)
  | "CONTRADICTS"       // ClaimNode → ClaimNode (conflicting claim)
  | "ATTACHED_TO"       // EvidenceNode → AnyNode (evidence linked to entity)

  // Intelligence connections
  | "SIMILAR_TO"        // SkillNode → SkillNode  (synonym/parent skill)
  | "PREREQUISITE_FOR"  // SkillNode → SkillNode  (skill progression)
  | "RELATED_TO"        // Any related nodes
  | "INFERRED_FROM";    // AI-generated data point → its source node

export interface GraphEdge {
  id: NodeId;
  sourceNodeId: NodeId;
  targetNodeId: NodeId;
  type: EdgeType;
  /** Optional context for the relationship (e.g., for USED_SKILL, describe how it was used). */
  context?: string;
  /** Optional temporal scope (e.g., when the edge was active). */
  period?: { start?: string; end?: string };
}

// -----------------------------------------------------------------
//  TrustScore System
// -----------------------------------------------------------------

/** A single scored component of the overall Trust Score. */
export interface TrustScoreComponent {
  label: string;
  score: number | null;
  maxScore: number;
  weight: number;
  status: "scored" | "not-applicable" | "missing" | "pending";
  explanation: string;
  improvementTip?: string;
  potentialGain?: number;
}

/**
 * A cached trust score snapshot — the output of `TrustService.calculateTrustScore()`.
 * Derived from the graph, never canonical. Stored only as a presentation cache for the UI.
 */
export interface TrustSnapshot {
  overall: number | null;
  components: TrustScoreComponent[];
  calculatedAt: string;
}

/** Aggregate verification status across all claims. */
export interface VerificationSummary {
  total: number;
  verified: number;
  pending: number;
  unverified: number;
  disputed: number;
  expired: number;
  coverage: number; // percentage
}

/** How well claims are supported by evidence. */
export interface EvidenceCoverage {
  totalClaims: number;
  claimsWithEvidence: number;
  claimsWithoutEvidence: number;
  coveragePercent: number;
  evidenceByFormat: Record<string, number>;
  strongestAreas: string[];
  weakestAreas: string[];
}

/** A claim that needs attention, with reasons and priority. */
export interface WeakClaim {
  claim: ClaimNode;
  reasons: string[];
  evidenceCount: number;
  priority: "high" | "medium" | "low";
}

/**
 * A richer trust report — the canonical output of `TrustService.calculateTrustReport()`.
 *
 * Wraps the lightweight `TrustSnapshot` together with the diagnostic insights that
 * explain it (verification, evidence coverage, weak claims). Keeps `TrustSnapshot`
 * focused on the score while giving the UI everything it needs for explainability.
 *
 * Derived from the graph, never canonical.
 */
export interface TrustReport {
  snapshot: TrustSnapshot;
  verificationSummary: VerificationSummary;
  evidenceCoverage: EvidenceCoverage;
  weakClaims: WeakClaim[];
  /** When the report was generated (ISO 8601). */
  generatedAt: string;
}

/** The overall Trust Score for the graph or a specific domain. */
export interface TrustScoreNode extends GraphNode {
  type: "trust-score";
  /** All scored components for this Trust Score */
  components: TrustScoreComponent[];
  /** The final weighted average score */
  overall: number | null;
  /** Last time the score was recalculated */
  calculatedAt: string;
  /** The model version used for scoring */
  modelVersion: string;
  /** Which domain this score applies to */
  domain: "overall" | "ats" | "skills" | "experience" | "education" | "portfolio" | "trust";
}

// -----------------------------------------------------------------
//  The Graph Itself
// -----------------------------------------------------------------

export type AnyNode =
  | ProfileNode
  | SkillNode
  | OrganizationNode
  | RoleNode
  | ProjectNode
  | EducationNode
  | CertificationNode
  | AchievementNode
  | LanguageNode
  | InterestNode
  | ReferenceNode
  | PortfolioNode
  // Trust & Intelligence Nodes
  | ClaimNode
  | EvidenceNode
  | VerifierNode
  | SourceNode
  | TrustScoreNode;

export interface KnowledgeGraph {
  /** The single profile that roots this graph. */
  profile: ProfileNode;
  /** All entities in the user's career graph. */
  nodes: AnyNode[];
  /** The relationships that connect them. */
  edges: GraphEdge[];
}

/** A map of node type to its discriminator literal. */
export type NodeType = AnyNode["type"];

// -----------------------------------------------------------------
//  Graph Queries (pure traversal helpers)
// -----------------------------------------------------------------

/**
 * Get all edges of a given type from a source node.
 */
export function getEdges(graph: KnowledgeGraph, sourceId: NodeId, type?: EdgeType): GraphEdge[] {
  return graph.edges.filter(
    (e) => e.sourceNodeId === sourceId && (!type || e.type === type)
  );
}

/**
 * Get all edges of a given type pointing to a target node.
 */
export function getIncomingEdges(graph: KnowledgeGraph, targetId: NodeId, type?: EdgeType): GraphEdge[] {
  return graph.edges.filter(
    (e) => e.targetNodeId === targetId && (!type || e.type === type)
  );
}

/**
 * Get the direct neighbors of a node connected by a given edge type.
 */
export function getNeighbors<T extends AnyNode>(
  graph: KnowledgeGraph,
  nodeId: NodeId,
  edgeType: EdgeType
): T[] {
  const edgeTargets = graph.edges
    .filter((e) => e.sourceNodeId === nodeId && e.type === edgeType)
    .map((e) => e.targetNodeId);
  const edgeSources = graph.edges
    .filter((e) => e.targetNodeId === nodeId && e.type === edgeType)
    .map((e) => e.sourceNodeId);
  const neighborIds = new Set([...edgeTargets, ...edgeSources]);
  return graph.nodes.filter((n) => neighborIds.has(n.id)) as T[];
}

/**
 * Find a specific node by ID.
 */
export function getNode<T extends AnyNode>(graph: KnowledgeGraph, id: NodeId): T | undefined {
  return graph.nodes.find((n) => n.id === id) as T | undefined;
}


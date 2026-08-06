"use strict";

/**
 * Graph Mapper — pure functions for Resume ⟷ KnowledgeGraph conversion.
 *
 * This is an anti-corruption layer. It isolates the domain model
 * (KnowledgeGraph) from the legacy flat Resume model so that neither
 * needs to know about the other's shape.
 *
 * Domain types stay in @/types/knowledge-graph; Resume types stay in
 * @/types/resume. Only this module imports both.
 */

import type { Resume, Evidence, ClaimType, ClaimVerificationStatus } from "@/types/resume";
import type {
  KnowledgeGraph,
  ProfileNode,
  SkillNode,
  OrganizationNode,
  RoleNode,
  ProjectNode,
  EducationNode,
  CertificationNode,
  AchievementNode,
  LanguageNode,
  InterestNode,
  ReferenceNode,
  PortfolioNode,
  ClaimNode,
  EvidenceNode,
  SourceNode,
} from "@/types/knowledge-graph";

// -----------------------------------------------------------------------
//  Resume → KnowledgeGraph
// -----------------------------------------------------------------------

/** Seed a KnowledgeGraph from a flat Resume object. */
export function resumeToGraph(
  resume: Resume,
  source: string = "user-input",
  evidence: Evidence[] = [],
): KnowledgeGraph {
  const {
    skills = [],
    experience = [],
    education = [],
    projects = [],
    certifications = [],
    languages = [],
    interests = [],
    achievements = [],
    references = [],
    portfolio = [],
    claims = [],
  } = resume;

  const now = new Date().toISOString();
  const profileId = `profile_${Date.now()}`;

  const profile: ProfileNode = {
    id: profileId,
    type: "profile",
    label: resume.name,
    title: resume.title,
    email: resume.email,
    phone: resume.phone,
    address: resume.address ?? "",
    nationality: resume.nationality ?? "",
    pronouns: resume.pronouns ?? "",
    summary: resume.summary,
    lastUpdated: now,
    source,
    careerStage: resume.careerStage,
    social: { ...resume.social },
  };

  const nodes: KnowledgeGraph["nodes"] = [profile];
  const edges: KnowledgeGraph["edges"] = [];
  const orgMap = new Map<string, string>();
  const skillMap = new Map<string, string>(); // normalized label → id

  const addEdge = (source: string, target: string, type: string, context?: string) => {
    edges.push({
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceNodeId: source,
      targetNodeId: target,
      type: type as any,
      context,
    });
  };

  const getOrCreateOrg = (label: string, location?: string, industry?: string): string => {
    const key = label.toLowerCase().trim();
    const existing = orgMap.get(key);
    if (existing) return existing;
    const id = `org_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const org: OrganizationNode = {
      id, type: "organization", label, location, industry, lastUpdated: now, source,
    };
    nodes.push(org);
    orgMap.set(key, id);
    return id;
  };

  const getOrCreateSkill = (label: string): string => {
    const key = label.toLowerCase().trim();
    const existing = skillMap.get(key);
    if (existing) return existing;
    const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const skill: SkillNode = {
      id, type: "skill", label, lastUpdated: now, source, proficiency: "Intermediate", category: "",
    };
    nodes.push(skill);
    skillMap.set(key, id);
    return id;
  };

  // Skills (deduplicate across both resume.skills and techUsed)
  for (const s of skills) {
    const sid = getOrCreateSkill(s.name);
    // Update proficiency and category from the explicit skill entry
    const node = nodes.find((n): n is SkillNode => n.id === sid && n.type === "skill");
    if (node) {
      node.proficiency = s.level;
      node.category = s.category ?? "";
    }
    addEdge(profileId, sid, "HAS_SKILL");
  }

  // Experience → Roles + Organizations
  for (const exp of experience) {
    const roleId = exp.id || `role_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orgId = exp.company ? getOrCreateOrg(exp.company, exp.location, exp.industry) : undefined;

    const role: RoleNode = {
      id: roleId, type: "role", label: exp.position, title: exp.position,
      startDate: exp.startDate, endDate: exp.endDate || "", isCurrent: exp.current || false,
      employmentType: (exp.employmentType as RoleNode["employmentType"]) || "Full-time",
      lastUpdated: now, source,
    };
    nodes.push(role);
    addEdge(profileId, roleId, "HAS_ROLE");
    if (orgId) addEdge(roleId, orgId, "WORKED_AT");

    // Tech used → skills (uses same getOrCreateSkill, so duplicates are avoided)
    if (exp.techUsed) {
      for (const t of exp.techUsed.split(",").map((s) => s.trim()).filter(Boolean)) {
        const sid = getOrCreateSkill(t);
        addEdge(sid, roleId, "USED_SKILL");
      }
    }
  }

  // Education
  for (const edu of education) {
    const eduId = edu.id || `edu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orgId = edu.school ? getOrCreateOrg(edu.school, edu.location) : undefined;

    const en: EducationNode = {
      id: eduId, type: "education", label: `${edu.degree} in ${edu.field}`,
      degree: edu.degree, field: edu.field, endDate: edu.year || "",
      gpa: edu.gpa, minor: edu.minor, honors: edu.honors, activities: edu.activities,
      location: edu.location, lastUpdated: now, source,
    };
    nodes.push(en);
    addEdge(profileId, eduId, "HAS_EDUCATION");
    if (orgId) addEdge(eduId, orgId, "STUDIED_AT");
  }

  // Projects
  for (const proj of projects) {
    const pid = proj.id || `project_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const pn: ProjectNode = {
      id: pid, type: "project", label: proj.name, description: proj.description ?? "",
      startDate: proj.startDate, endDate: proj.endDate, status: proj.status || "Completed",
      url: proj.link, role: proj.role, teamSize: proj.teamSize,
      bulletPoints: proj.bulletPoints ?? [], lastUpdated: now, source,
    };
    nodes.push(pn);
    // Projects are distinct from portfolio items; use HAS_ACHIEVEMENT as project
    // marker since the EdgeType system doesn't have HAS_PROJECT yet
    addEdge(profileId, pid, "HAS_PORTFOLIO");
  }

  // Certifications
  for (const cert of certifications) {
    const cid = cert.id || `cert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cn: CertificationNode = {
      id: cid, type: "certification", label: cert.name, issuer: cert.issuer,
      issueDate: cert.date, expiryDate: cert.expiryDate, url: cert.link,
      description: cert.description, lastUpdated: now, source,
    };
    nodes.push(cn);
    addEdge(profileId, cid, "HAS_CERTIFICATION");
  }

  // Languages
  for (const lang of languages) {
    const lid = lang.id || `lang_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    nodes.push({ id: lid, type: "language", label: lang.name, lastUpdated: now, source, proficiency: lang.proficiency } as LanguageNode);
    addEdge(profileId, lid, "HAS_LANGUAGE");
  }

  // Interests
  for (const int of interests) {
    const iid = int.id || `int_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    nodes.push({ id: iid, type: "interest", label: int.name, lastUpdated: now, source } as InterestNode);
    addEdge(profileId, iid, "HAS_INTEREST");
  }

  // Achievements
  for (const ach of achievements) {
    const aid = ach.id || `ach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    nodes.push({ id: aid, type: "achievement", label: ach.title, description: ach.description, date: ach.date, issuer: ach.issuer, lastUpdated: now, source } as AchievementNode);
    addEdge(profileId, aid, "HAS_ACHIEVEMENT");
  }

  // References
  for (const ref of references) {
    const rid = ref.id || `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    nodes.push({ id: rid, type: "reference", label: ref.name, name: ref.name, position: ref.position, email: ref.email, phone: ref.phone, organization: ref.company, lastUpdated: now, source } as ReferenceNode);
    addEdge(profileId, rid, "HAS_REFERENCE");
  }

  // Portfolio
  for (const por of portfolio) {
    const poid = por.id || `port_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    nodes.push({ id: poid, type: "portfolio", label: por.title, description: por.description, url: por.url, mediaType: por.type || "other", lastUpdated: now, source } as PortfolioNode);
    addEdge(profileId, poid, "HAS_PORTFOLIO");
  }

  // Claims → ClaimNodes (only accepted claims; no claim is created automatically)
  for (const claim of claims) {
    if (!claim.accepted) continue;

    const claimId = claim.id || `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const claimNode: ClaimNode = {
      id: claimId,
      type: "claim",
      label: claim.assertionText,
      assertion: claim.assertionText,
      // Map the resume claimType to the graph claimType taxonomy.
      claimType: mapClaimType(claim.claimType),
      hasMetric: false,
      confidence: claim.confidence,
      verificationStatus: mapVerificationStatus(claim.verificationStatus),
      lastUpdated: now,
      source,
    };
    nodes.push(claimNode);
    addEdge(profileId, claimId, "HAS_CLAIM");

    // Evidence → EvidenceNodes, linked to the claim via SUPPORTED_BY.
    const evidenceForClaim = (evidence ?? []).filter((e) => e.claimId === claimId);
    for (const ev of evidenceForClaim) {
      const evId = ev.id || `evidence_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const evidenceNode: EvidenceNode = {
        id: evId,
        type: "evidence",
        label: ev.metadata.fileName || ev.metadata.linkTitle || ev.evidenceKind,
        format: mapEvidenceFormat(ev.evidenceType),
        location: ev.content,
        description: ev.notes || undefined,
        lastUpdated: now,
        source,
      };
      nodes.push(evidenceNode);
      addEdge(claimId, evId, "SUPPORTED_BY");

      // Evidence → SourceNode via DERIVED_FROM (provenance).
      const sourceNode: SourceNode = {
        id: `src_${ev.id || evId}`,
        type: "source",
        label: ev.evidenceKind,
        sourceType: "user-input",
        importedAt: now,
        isPrimary: true,
        lastUpdated: now,
        source,
      };
      nodes.push(sourceNode);
      addEdge(evId, sourceNode.id, "DERIVED_FROM");
    }
  }

  return { profile, nodes, edges };
}

// -----------------------------------------------------------------------
//  KnowledgeGraph → Resume
// -----------------------------------------------------------------------

/** Convert the KnowledgeGraph back into a flat Resume object. */
export function graphToResume(graph: KnowledgeGraph): Resume {
  const p = graph.profile;
  const orgs = new Map(
    graph.nodes
      .filter((n): n is OrganizationNode => n.type === "organization")
      .map((o) => [o.id, o]),
  );

  const getNode = <T>(id: string): T | undefined =>
    graph.nodes.find((n) => n.id === id) as T | undefined;

  const getEdges = (source: string, type?: string) =>
    graph.edges.filter((e) => e.sourceNodeId === source && (!type || e.type === type));

  const getIncomingEdges = (target: string, type?: string) =>
    graph.edges.filter((e) => e.targetNodeId === target && (!type || e.type === type));

  const experience = getEdges(p.id, "HAS_ROLE")
    .map((e) => {
      const role = getNode<RoleNode>(e.targetNodeId);
      if (!role) return null;
      const org = getEdges(role.id, "WORKED_AT")[0];
      const organization = org ? orgs.get(org.targetNodeId) : undefined;
      const skillEdges = getIncomingEdges(role.id, "USED_SKILL");
      const techUsed = skillEdges
        .map((se) => getNode<SkillNode>(se.sourceNodeId))
        .filter(Boolean)
        .map((s) => s!.label)
        .join(", ");
      const achEdges = getIncomingEdges(role.id, "ACCOMPLISHED");
      const bulletPoints = achEdges
        .map((ae) => getNode<AchievementNode>(ae.sourceNodeId))
        .filter(Boolean)
        .map((a) => a!.description);
      return {
        id: role.id, company: organization?.label ?? "", position: role.title,
        location: organization?.location ?? "", employmentType: role.employmentType,
        industry: organization?.industry ?? "", startDate: role.startDate,
        endDate: role.endDate ?? "", current: role.isCurrent, duration: "",
        description: "", achievements: "", techUsed, bulletPoints,
      };
    })
    .filter(Boolean) as Resume["experience"];

  const education = getEdges(p.id, "HAS_EDUCATION")
    .map((e) => {
      const edu = getNode<EducationNode>(e.targetNodeId);
      if (!edu) return null;
      const org = getEdges(edu.id, "STUDIED_AT")[0];
      const school = org ? orgs.get(org.targetNodeId)?.label ?? "" : "";
      return {
        id: edu.id, school, degree: edu.degree, year: edu.endDate ?? "", field: edu.field,
        gpa: edu.gpa ?? "", minor: edu.minor ?? "", honors: edu.honors ?? "",
        activities: edu.activities ?? "", location: edu.location ?? "",
      };
    })
    .filter(Boolean) as Resume["education"];

  const skills = getEdges(p.id, "HAS_SKILL")
    .map((e) => {
      const s = getNode<SkillNode>(e.targetNodeId);
      return s ? { id: s.id, name: s.label, level: s.proficiency, category: s.category ?? "", years: "" } : null;
    })
    .filter(Boolean) as Resume["skills"];

  const skillMap = new Map(skills.map((s) => [s.id, s.name]));

  const projects = graph.nodes
    .filter((n): n is ProjectNode => n.type === "project")
    .map((proj) => ({
      id: proj.id, name: proj.label, description: proj.description,
      tech: proj.bulletPoints.filter((b) => b.startsWith("tech:")).join(", "),
      link: proj.url ?? "", startDate: proj.startDate ?? "", endDate: proj.endDate ?? "",
      role: proj.role ?? "", teamSize: proj.teamSize ?? "", status: proj.status,
      bulletPoints: proj.bulletPoints.filter((b) => !b.startsWith("tech:")),
    }));

  const certifications = getEdges(p.id, "HAS_CERTIFICATION")
    .map((e) => {
      const c = getNode<CertificationNode>(e.targetNodeId);
      return c ? { id: c.id, name: c.label, issuer: c.issuer, date: c.issueDate, link: c.url ?? "", description: c.description ?? "", expiryDate: c.expiryDate ?? "", skills: "" } : null;
    })
    .filter(Boolean) as Resume["certifications"];

  const languages = getEdges(p.id, "HAS_LANGUAGE")
    .map((e) => {
      const l = getNode<LanguageNode>(e.targetNodeId);
      return l ? { id: l.id, name: l.label, proficiency: l.proficiency } : null;
    })
    .filter(Boolean) as Resume["languages"];

  const interests = getEdges(p.id, "HAS_INTEREST")
    .map((e) => {
      const i = getNode<InterestNode>(e.targetNodeId);
      return i ? { id: i.id, name: i.label } : null;
    })
    .filter(Boolean) as Resume["interests"];

  const achievements = getEdges(p.id, "HAS_ACHIEVEMENT")
    .map((e) => {
      const a = getNode<AchievementNode>(e.targetNodeId);
      return a ? { id: a.id, title: a.label, description: a.description, date: a.date, issuer: a.issuer ?? "" } : null;
    })
    .filter(Boolean) as Resume["achievements"];

  const references = getEdges(p.id, "HAS_REFERENCE")
    .map((e) => {
      const r = getNode<ReferenceNode>(e.targetNodeId);
      return r ? { id: r.id, name: r.name, company: r.organization ?? "", position: r.position, email: r.email, phone: r.phone ?? "" } : null;
    })
    .filter(Boolean) as Resume["references"];

  const portfolio = getEdges(p.id, "HAS_PORTFOLIO")
    .map((e) => {
      const po = getNode<PortfolioNode>(e.targetNodeId);
      // Only include actual PortfolioNodes (not ProjectNodes that were mapped via the same edge type)
      if (!po || po.type !== "portfolio") return null;
      return { id: po.id, title: po.label, description: po.description, url: po.url, type: po.mediaType };
    })
    .filter(Boolean) as Resume["portfolio"];

  return {
    name: p.label, title: p.title, email: p.email, phone: p.phone,
    address: p.address ?? "", nationality: p.nationality ?? "", pronouns: p.pronouns ?? "",
    summary: p.summary, social: { ...p.social },
    experience, education, skills, projects, certifications,
    languages, interests, achievements, references, portfolio,
    templateId: "modern-clean", careerStage: p.careerStage, claims: [],
  };
}

// -----------------------------------------------------------------------
//  Type mappings (Resume domain → KnowledgeGraph taxonomy)
// -----------------------------------------------------------------------

function mapClaimType(type: ClaimType): ClaimNode["claimType"] {
  switch (type) {
    case "Employment": return "experience";
    case "Education": return "education";
    case "Certification": return "credential";
    case "Project": return "achievement";
    case "Skill": return "skill-proficiency";
    case "Contribution": return "achievement";
    default: return "responsibility";
  }
}

function mapVerificationStatus(status: ClaimVerificationStatus): ClaimNode["verificationStatus"] {
  switch (status) {
    case "verified": return "verified";
    case "under-review": return "pending";
    case "disputed": return "disputed";
    case "revoked": return "disputed";
    case "expired": return "expired";
    default: return "unverified";
  }
}

function mapEvidenceFormat(format: Evidence["evidenceType"]): EvidenceNode["format"] {
  switch (format) {
    case "file": return "document";
    case "document": return "document";
    case "link": return "link";
    default: return "artifact";
  }
}

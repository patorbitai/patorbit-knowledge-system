"use strict";

import { useResumeBuilder } from "@/store/resume-builder";
import type { Resume, Evidence } from "@/types/resume";
import type { OrganizationNode, RoleNode, ReferenceNode, SkillNode } from "@/types/knowledge-graph";
import { Network, Building2, Briefcase, Award, Users } from "lucide-react";
import { GraphService } from "@/services/graph-service";
import { resumeToGraph } from "@/services/graph-mapper";

export interface NetworkViewProps {
  resume?: Resume;
  evidence?: Evidence[];
  isLoading?: boolean;
  error?: string | null;
}

export function NetworkView({
  resume: propResume,
  evidence: propEvidence,
  isLoading = false,
  error = null,
}: NetworkViewProps = {}) {
  const storeResume = useResumeBuilder((s) => s.resume);
  const storeEvidence = useResumeBuilder((s) => s.evidence ?? []);

  const resume = propResume ?? storeResume;
  const evidence = propEvidence ?? storeEvidence;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Professional Network</h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualize your professional relationships, journey, and connections in one place.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
          <Network className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
          <h3 className="text-sm font-medium text-white">Loading network graph...</h3>
          <p className="text-xs text-slate-400">Assembling your professional relationships and career graph.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Professional Network</h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualize your professional relationships, journey, and connections in one place.
          </p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-3">
          <h3 className="text-sm font-medium text-red-400">Failed to load network</h3>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  let overview = null;
  let orgs: Array<{ org: OrganizationNode; roles: RoleNode[] }> = [];
  let references: ReferenceNode[] = [];
  let skills: SkillNode[] = [];
  let timeline: Array<{ date: string; type: string; label: string; nodeId: string }> = [];

  try {
    const graphService = new GraphService();
    const graph = resumeToGraph(resume, "user-input", evidence);
    graphService.setGraph(graph);
    overview = graphService.getCareerOverview();
    orgs = graphService.getOrganizations();
    references = graphService.findReferences();
    skills = graphService.findSkills();
    timeline = graphService.getCareerTimeline();
  } catch (err) {
    console.error("Failed to compute network graph:", err);
  }

  const isEmpty =
    !resume ||
    (!resume.name &&
      !resume.title &&
      (resume.experience ?? []).length === 0 &&
      (resume.skills ?? []).length === 0 &&
      orgs.length === 0);

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Professional Network</h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualize your professional relationships, journey, and applications in one place.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-3">
          <Network className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-white">No network data yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add profile details, experience, skills, and professional references to populate your knowledge graph and professional network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Professional Network</h1>
        <p className="text-sm text-slate-400 mt-1">
          Visualize your professional relationships, journey, and connections in one place.
        </p>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Organizations</div>
            <div className="mt-2 text-2xl font-semibold text-white">{orgs.length}</div>
            <p className="mt-1 text-xs text-slate-400">Companies & institutions</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Roles & Positions</div>
            <div className="mt-2 text-2xl font-semibold text-white">{overview.totalRoles}</div>
            <p className="mt-1 text-xs text-slate-400">{overview.totalYearsExperience} yrs total experience</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Skills & Expertise</div>
            <div className="mt-2 text-2xl font-semibold text-white">{overview.totalSkills}</div>
            <p className="mt-1 text-xs text-slate-400">Connected expertise nodes</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">References</div>
            <div className="mt-2 text-2xl font-semibold text-cyan-400">{references.length}</div>
            <p className="mt-1 text-xs text-slate-400">Professional referees</p>
          </div>
        </div>
      )}

      {/* Organizations & Connections */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />
          Organizations & Connected Workplaces ({orgs.length})
        </h3>
        {orgs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No organizations or workplaces recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {orgs.map(({ org, roles }, idx) => (
              <div key={org.id || idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{org.label}</span>
                  {org.industry && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {org.industry}
                    </span>
                  )}
                </div>
                {roles.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {roles.map((r) => (
                      <div key={r.id} className="text-xs text-slate-400 flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        <span>{r.title}</span>
                        <span className="text-slate-600">({r.startDate} — {r.isCurrent ? "Present" : r.endDate || "—"})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connected Skills & Expertise */}
      {skills.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            Connected Skills & Expertise ({skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-slate-200"
              >
                <span className="font-medium text-white">{skill.label}</span>
                {skill.proficiency && (
                  <span className="text-[10px] text-cyan-400">({skill.proficiency})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Professional References / Connections */}
      {references.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Professional References & Connections ({references.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {references.map((ref) => (
              <div key={ref.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
                <p className="text-sm font-medium text-white">{ref.name}</p>
                <p className="text-xs text-slate-400">{ref.position} {ref.organization ? `at ${ref.organization}` : ""}</p>
                <p className="text-[11px] text-slate-500">{ref.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career Journey / Network Timeline */}
      {timeline.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Career Journey Timeline
          </h3>
          <div className="space-y-3">
            {timeline.slice(0, 10).map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-slate-200">{event.label}</span>
                  <span className="text-slate-500">{event.date.slice(0, 7)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

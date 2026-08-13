"use client";
"use strict";

import { useState, useMemo } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import type { Resume, Evidence } from "@/types/resume";
import type { NodeId } from "@/types/knowledge-graph";
import {
  Network,
  Building2,
  Briefcase,
  Users,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
  X,
  Map,
  Layers,
} from "lucide-react";
import { GraphService } from "@/services/graph-service";
import { resumeToGraph } from "@/services/graph-mapper";
import { CareerJourneyView } from "./CareerJourneyView";

export interface NetworkViewProps {
  resume?: Resume;
  evidence?: Evidence[];
  isLoading?: boolean;
  error?: string | null;
  initialTab?: "graph" | "journey" | "overview";
}

export function NetworkView({
  resume: propResume,
  evidence: propEvidence,
  isLoading = false,
  error = null,
  initialTab = "graph",
}: NetworkViewProps = {}) {
  const storeResume = useResumeBuilder((s) => s.resume);
  const storeEvidence = useResumeBuilder((s) => s.evidence ?? []);

  const resume = propResume ?? storeResume;
  const evidence = propEvidence ?? storeEvidence;

  const [activeTab, setActiveTab] = useState<"graph" | "journey" | "overview">(initialTab);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");

  const graph = useMemo(() => {
    try {
      if (!resume) return null;
      return resumeToGraph(resume, "user-input", evidence);
    } catch {
      return null;
    }
  }, [resume, evidence]);

  const graphService = useMemo(() => {
    const gs = new GraphService();
    if (graph) gs.setGraph(graph);
    return gs;
  }, [graph]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Professional Network & Knowledge Graph</h1>
          <p className="text-sm text-slate-400 mt-1">Interactive professional entity graph and career progression.</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
          <Network className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
          <h3 className="text-sm font-medium text-white">Loading knowledge graph...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-3">
          <h3 className="text-sm font-medium text-red-400">Failed to load network graph</h3>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const isEmpty =
    !resume ||
    (!resume.name &&
      !resume.title &&
      (resume.experience ?? []).length === 0 &&
      (resume.skills ?? []).length === 0);

  if (isEmpty || !graph) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Professional Network & Knowledge Graph</h1>
          <p className="text-sm text-slate-400 mt-1">Interactive professional entity graph and career progression.</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
          <Network className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-white">No network graph data yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add profile information, experience, skills, and projects in the Resume Builder to generate your interactive knowledge graph.
          </p>
        </div>
      </div>
    );
  }

  const overview = graphService.getCareerOverview();
  const timeline = graphService.getCareerTimeline();
  const allNodes = graphService.getNodesByType();
  const selectedNode = selectedNodeId ? graphService.getNode(selectedNodeId) : null;
  const nodeEdges = selectedNodeId ? graphService.getEdges(selectedNodeId) : [];
  const incomingEdges = selectedNodeId ? graphService.getIncomingEdges(selectedNodeId) : [];

  const filteredNodes = allNodes.filter((node) => {
    const matchesSearch =
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || node.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Professional Network & Knowledge Graph</h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore your connected professional profile, entities, and career journey.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("graph")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "graph" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            Knowledge Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("journey")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "journey" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            Career Journey
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "overview" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Organizations</div>
          <div className="mt-2 text-2xl font-semibold text-white">{graphService.findOrganizations().length}</div>
          <p className="mt-1 text-xs text-slate-400">Employers & schools</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Roles & Experience</div>
          <div className="mt-2 text-2xl font-semibold text-white">{overview.totalRoles}</div>
          <p className="mt-1 text-xs text-slate-400">{overview.totalYearsExperience} yrs experience</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Skills & Expertise</div>
          <div className="mt-2 text-2xl font-semibold text-white">{overview.totalSkills}</div>
          <p className="mt-1 text-xs text-slate-400">Connected nodes</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Graph Entities</div>
          <div className="mt-2 text-2xl font-semibold text-cyan-400">{graphService.nodeCount()}</div>
          <p className="mt-1 text-xs text-slate-400">{graphService.edgeCount()} relationships</p>
        </div>
      </div>

      {/* Tab 1: Knowledge Graph */}
      {activeTab === "graph" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-5 space-y-4 flex flex-col min-h-[500px]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search graph nodes..."
                  aria-label="Search graph nodes"
                  className="w-full bg-transparent text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  aria-label="Filter graph nodes by type"
                  className="bg-slate-800 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="profile">Profile</option>
                  <option value="organization">Organization</option>
                  <option value="role">Role</option>
                  <option value="skill">Skill</option>
                  <option value="project">Project</option>
                  <option value="claim">Claim</option>
                  <option value="evidence">Evidence</option>
                </select>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.5))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setZoomLevel(1); setSearchTerm(""); setFilterType("all"); setSelectedNodeId(null); }}
                  title="Reset View"
                  className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto pr-1 transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
            >
              {filteredNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Network className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400">No nodes match your filter criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                  {filteredNodes.map((node) => {
                    const isSelected = node.id === selectedNodeId;
                    return (
                      <div
                        key={node.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedNodeId(node.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedNodeId(node.id);
                          }
                        }}
                        aria-pressed={isSelected}
                        className={`p-3.5 rounded-xl border transition-all text-left group cursor-pointer ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                            {node.type}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-xs font-semibold text-white truncate">{node.label || "Untitled Node"}</p>
                        {"title" in node && node.title && node.title !== node.label && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{String(node.title)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 text-center pt-2 border-t border-white/[0.06]">
              Showing {filteredNodes.length} of {allNodes.length} knowledge graph nodes. Click any node to inspect relationships and details.
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0A0E1B] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Node Details</h3>
              {selectedNodeId && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Close Details"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Type</span>
                  <p className="text-sm font-bold text-cyan-400 capitalize mt-0.5">{selectedNode.type}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Label / Name</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectedNode.label}</p>
                </div>

                {"description" in selectedNode && selectedNode.description && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Description</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{String(selectedNode.description)}</p>
                  </div>
                )}

                {"assertion" in selectedNode && selectedNode.assertion && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Claim Assertion</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{String(selectedNode.assertion)}</p>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Relationships ({nodeEdges.length + incomingEdges.length})</span>
                  {nodeEdges.length === 0 && incomingEdges.length === 0 ? (
                    <p className="text-slate-500 italic">No direct edges connected.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {nodeEdges.map((e) => {
                        const target = graphService.getNode(e.targetNodeId);
                        return (
                          <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <span className="text-cyan-300 font-mono text-[10px]">{e.type} →</span>
                            <span className="text-slate-200 truncate ml-2">{target?.label || e.targetNodeId}</span>
                          </div>
                        );
                      })}
                      {incomingEdges.map((e) => {
                        const source = graphService.getNode(e.sourceNodeId);
                        return (
                          <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <span className="text-slate-400 font-mono text-[10px]">← {e.type}</span>
                            <span className="text-slate-200 truncate ml-2">{source?.label || e.sourceNodeId}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedNode.type === "claim" && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Supporting Evidence</span>
                    {graphService.findEvidenceForClaim(selectedNode.id).length === 0 ? (
                      <p className="text-slate-500 italic">No evidence attached to this claim.</p>
                    ) : (
                      graphService.findEvidenceForClaim(selectedNode.id).map((ev) => (
                        <div key={ev.id} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                          <p className="font-medium">{ev.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 uppercase">{ev.format}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Layers className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Select any node in the knowledge graph to inspect its properties and relationships.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Career Journey */}
      {activeTab === "journey" && <CareerJourneyView />}

      {/* Tab 3: Overview & Analytics */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Organizations & Employers ({graphService.findOrganizations().length})
            </h3>
            {graphService.findOrganizations().length === 0 ? (
              <p className="text-xs text-slate-500 italic">No organizations recorded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {graphService.findOrganizations().map((org) => (
                  <div key={org.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
                    <p className="text-sm font-medium text-white">{org.label}</p>
                    {org.industry && <p className="text-xs text-cyan-400">Industry: {org.industry}</p>}
                    {org.location && <p className="text-[11px] text-slate-400">Location: {org.location}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Skills & Expertise ({graphService.findSkills().length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {graphService.findSkills().map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-slate-200"
                >
                  <span className="font-medium text-white">{skill.label}</span>
                </span>
              ))}
            </div>
          </div>

          {graphService.findReferences().length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Professional References ({graphService.findReferences().length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {graphService.findReferences().map((ref) => (
                  <div key={ref.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
                    <p className="text-sm font-medium text-white">{ref.name}</p>
                    <p className="text-xs text-slate-400">{ref.position} {ref.organization ? `at ${ref.organization}` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

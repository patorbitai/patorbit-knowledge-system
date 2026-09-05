"use client";
"use strict";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { IdentityNav } from "./IdentityNav";

export interface NetworkViewProps {
  resume?: Resume;
  evidence?: Evidence[];
  isLoading?: boolean;
  error?: string | null;
  initialTab?: "graph" | "journey" | "overview";
  /** Compact, headerless variant for embedding inside a workspace (e.g. Professional Preview). */
  embedded?: boolean;
}

export function NetworkView({
  resume: propResume,
  evidence: propEvidence,
  isLoading = false,
  error = null,
  initialTab = "graph",
  embedded = false,
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

  // NOTE: these memos must stay above the early returns so every hook is
  // called unconditionally in the same order on every render (Rules of Hooks).
  // They are safe to compute on an empty GraphService — the early-return
  // branches never read their values.
  const connectionSummary = useMemo(() => {
    if (!selectedNodeId) return { skills: 0, organization: 0, projects: 0, education: 0 };
    const allOutgoing = graphService.getEdges(selectedNodeId);
    const allIncoming = graphService.getIncomingEdges(selectedNodeId);
    let skills = 0, organization = 0, projects = 0, education = 0;
    for (const e of [...allOutgoing, ...allIncoming]) {
      const otherId = e.sourceNodeId === selectedNodeId ? e.targetNodeId : e.sourceNodeId;
      const targetNode = graphService.getNode(otherId);
      if (!targetNode) continue;
      if (targetNode.type === "skill") skills++;
      else if (targetNode.type === "organization") organization++;
      else if (targetNode.type === "project") projects++;
      else if (targetNode.type === "education") education++;
    }
    return { skills, organization, projects, education };
  }, [selectedNodeId, graphService]);

  const popularSkills = useMemo(() => {
    return graphService.findSkills().slice(0, 8);
  }, [graphService]);

  if (isLoading) {
    return (
      <div className={`${embedded ? "max-w-5xl px-4 py-6 space-y-6" : "mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6"}`}>
        {!embedded && (
          <div>
            <h1 className="text-2xl font-bold text-white">Professional Network & Knowledge Graph</h1>
            <p className="text-sm text-slate-400 mt-1">Interactive professional entity graph and career progression.</p>
          </div>
        )}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
          <Network className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
          <h3 className="text-sm font-medium text-white">Loading knowledge graph...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${embedded ? "max-w-5xl px-4 py-6 space-y-6" : "mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6"}`}>
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

  // The Career Journey tab renders independently of graph data (it derives
  // directly from the user's real resume via CareerJourneyView), so the
  // graph empty state must NOT suppress it. Only graph-dependent tabs
  // (Knowledge Graph, Overview) fall through to the empty-graph card.
  if ((isEmpty || !graph) && activeTab !== "journey") {
    return (
      <div className={`${embedded ? "max-w-5xl px-4 py-6 space-y-6" : "mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6"}`}>
        {!embedded && (
          <div>
            <h1 className="text-2xl font-bold text-white">Professional Network & Knowledge Graph</h1>
            <p className="text-sm text-slate-400 mt-1">Interactive professional entity graph and career progression.</p>
          </div>
        )}
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
    <div className={`${embedded ? "max-w-6xl px-4 sm:px-6 py-6 lg:px-8" : "mx-auto max-w-6xl px-4 py-8 lg:px-12"} font-sans space-y-8`}>
      {/* Header & Tabs (title hidden when embedded — the host workspace provides it) */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 pb-2 ${embedded ? "sm:justify-end" : "sm:justify-between"}`}>
        {!embedded && (
          <div className="space-y-3">
            <IdentityNav />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Knowledge Graph & Career Journey</h1>
              <p className="text-sm text-gray-500 dark:text-[#a9b9cf] font-light mt-1">
                Explore your connected professional profile, entities, and career journey.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-[rgba(148,163,184,.15)] bg-gray-100 dark:bg-[rgba(10,18,32,0.8)] p-1 backdrop-blur">
          <button
            type="button"
            onClick={() => setActiveTab("graph")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "graph" ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Knowledge Graph
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("journey")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "journey" ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Career Journey
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Overview
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl p-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(148,163,184,.14)]">
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">🏢</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{graphService.findOrganizations().length}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Organizations</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">💼</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{overview.totalRoles}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Roles & Experience</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">⚡</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{overview.totalSkills}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Skills & Expertise</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">🌐</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{graphService.nodeCount()}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Graph Entities</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tab 1: Knowledge Graph */}
      {activeTab === "graph" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left: Your Knowledge Graph */}
            <div className="lg:col-span-2 rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-6 shadow-xl min-h-[580px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[rgba(148,163,184,.1)] pb-4">
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-400" />
                    YOUR KNOWLEDGE GRAPH
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">{filteredNodes.length} nodes</span>
                  </div>
                </div>

                {/* Search, Filter & Zoom Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070d18] p-3 rounded-xl border border-[rgba(148,163,184,.12)]">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search graph nodes..."
                      aria-label="Search graph nodes"
                      className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      aria-label="Filter graph nodes by type"
                      className="bg-[#0f172a] border border-[rgba(148,163,184,.2)] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none cursor-pointer font-medium"
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
                      className="p-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
                      title="Zoom Out"
                      className="p-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setZoomLevel(1); setSearchTerm(""); setFilterType("all"); setSelectedNodeId(null); }}
                      title="Reset View"
                      className="p-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Graph canvas / Nodes grid */}
              <div
                className="flex-1 overflow-y-auto pr-1 transition-transform duration-200 my-4"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
              >
                {filteredNodes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Network className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">No nodes match your filter criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
                    {filteredNodes.map((node, idx) => {
                      const isSelected = node.id === selectedNodeId;
                      let badgeColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                      if (node.type === "role") badgeColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                      else if (node.type === "skill") badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      else if (node.type === "project") badgeColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                      else if (node.type === "education") badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";

                      return (
                        <div
                          key={`${node.type}-${node.id}-${idx}`}
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
                          className={`p-4 rounded-xl border transition-all text-left group cursor-pointer ${
                            isSelected
                              ? "border-cyan-500 bg-cyan-500/15 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500"
                              : "border-[rgba(148,163,184,.14)] bg-[#070d18]/60 hover:border-cyan-500/40 hover:bg-[#070d18]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${badgeColor}`}>
                              {node.type}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                          </div>
                          <p className="text-xs font-bold text-white truncate">{node.label || "Untitled Node"}</p>
                          {"title" in node && node.title && node.title !== node.label && (
                            <p className="text-[11px] text-[#94a3b8] truncate mt-1">{String(node.title)}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 text-center pt-3 border-t border-[rgba(148,163,184,.1)]">
                Showing {filteredNodes.length} of {allNodes.length} knowledge graph nodes. Click any node to inspect relationships and details.
              </div>
            </div>

            {/* Right: Node Details */}
            <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-[rgba(148,163,184,.1)] pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">NODE DETAILS</h3>
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
                <div className="space-y-5 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">Type</span>
                    <p className="text-sm font-bold text-cyan-400 capitalize">{selectedNode.type}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">Label / Name</span>
                    <p className="text-base font-bold text-white">{selectedNode.label}</p>
                  </div>

                  {"description" in selectedNode && selectedNode.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">Description</span>
                      <p className="text-[#cbd5e1] leading-relaxed font-light">{String(selectedNode.description)}</p>
                    </div>
                  )}

                  {/* Connection Summary Tiles */}
                  <div className="space-y-2 pt-2 border-t border-[rgba(148,163,184,.1)]">
                    <span className="text-[10px] font-bold text-[#71839b] uppercase tracking-wider">Connection Summary</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18]">
                        <b className="text-sm font-extrabold text-white font-mono">{connectionSummary.skills}</b>
                        <span className="block text-[11px] text-[#94a3b8]">Skills</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18]">
                        <b className="text-sm font-extrabold text-white font-mono">{connectionSummary.organization}</b>
                        <span className="block text-[11px] text-[#94a3b8]">Organization</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18]">
                        <b className="text-sm font-extrabold text-white font-mono">{connectionSummary.projects}</b>
                        <span className="block text-[11px] text-[#94a3b8]">Projects</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18]">
                        <b className="text-sm font-extrabold text-white font-mono">{connectionSummary.education}</b>
                        <span className="block text-[11px] text-[#94a3b8]">Education</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[rgba(148,163,184,.1)]">
                    <span className="text-[10px] font-bold text-[#71839b] uppercase tracking-wider">Relationships ({nodeEdges.length + incomingEdges.length})</span>
                    {nodeEdges.length === 0 && incomingEdges.length === 0 ? (
                      <p className="text-slate-500 italic">No direct edges connected.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {nodeEdges.map((e, idx) => {
                          const target = graphService.getNode(e.targetNodeId);
                          return (
                            <div key={`${e.id}-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d18] border border-[rgba(148,163,184,.1)]">
                              <span className="text-cyan-300 font-mono text-[10px] font-bold">{e.type} →</span>
                              <span className="text-slate-200 truncate ml-2 font-medium">{target?.label || e.targetNodeId}</span>
                            </div>
                          );
                        })}
                        {incomingEdges.map((e, idx) => {
                          const source = graphService.getNode(e.sourceNodeId);
                          return (
                            <div key={`${e.id}-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d18] border border-[rgba(148,163,184,.1)]">
                              <span className="text-slate-400 font-mono text-[10px] font-bold">← {e.type}</span>
                              <span className="text-slate-200 truncate ml-2 font-medium">{source?.label || e.sourceNodeId}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[rgba(148,163,184,.1)]">
                    <Link
                      href="/resume-builder"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View Full Profile →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-72 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Select any node in the Knowledge Graph to inspect its properties and relationships.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Bottom: Popular Skills */}
          <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[rgba(148,163,184,.1)] pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">POPULAR SKILLS</h3>
              <Link href="/resume-builder" className="text-xs font-bold text-cyan-400 hover:underline">
                View all skills →
              </Link>
            </div>
            {popularSkills.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No skills recorded in the graph yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill, idx) => (
                  <span
                    key={`${skill.id}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#070d18] border border-[rgba(148,163,184,.15)] px-3.5 py-2 text-xs text-slate-200 font-semibold shadow-sm"
                  >
                    <span className="text-white">{skill.label}</span>
                    <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 font-mono">
                      {skill.proficiency || "Active"}
                    </span>
                  </span>
                ))}
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
                {graphService.findOrganizations().map((org, idx) => (
                  <div key={`${org.id}-${idx}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
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
              {graphService.findSkills().map((skill, idx) => (
                <span
                  key={`${skill.id}-${idx}`}
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
                {graphService.findReferences().map((ref, idx) => (
                  <div key={`${ref.id}-${idx}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
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

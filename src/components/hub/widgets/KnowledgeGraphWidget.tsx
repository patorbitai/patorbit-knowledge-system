import Link from "next/link";
import { Network, ArrowRight } from "lucide-react";
import WidgetCard from "./WidgetCard";

export default function KnowledgeGraphWidget() {
  return (
    <WidgetCard
      title="Knowledge Graph"
      icon={Network}
      action={{ label: "Explore graph", href: "/network" }}
    >
      <div className="flex flex-col items-center justify-center py-3 gap-3">
        {/* Animated node graphic */}
        <div className="relative h-20 w-20" aria-hidden="true">
          <svg viewBox="0 0 96 96" className="h-20 w-20">
            {/* Connecting lines */}
            <line x1="48" y1="48" x2="18" y2="22" stroke="rgba(34,211,238,0.12)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="48" y1="48" x2="78" y2="22" stroke="rgba(34,211,238,0.12)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="48" y1="48" x2="14" y2="68" stroke="rgba(34,211,238,0.12)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="48" y1="48" x2="82" y2="68" stroke="rgba(34,211,238,0.12)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Outer nodes */}
            <circle cx="18" cy="22" r="4" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
            <circle cx="78" cy="22" r="4" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
            <circle cx="14" cy="68" r="4" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
            <circle cx="82" cy="68" r="4" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
            {/* Center node — slightly larger with glow */}
            <circle cx="48" cy="48" r="10" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
            <circle cx="48" cy="48" r="4" fill="rgba(34,211,238,0.4)" />
          </svg>
        </div>

        <div className="text-center space-y-1 max-w-[200px]">
          <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">
            Your professional network graph
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed">
            Connects your skills, experience, and relationships into a visual career map
          </p>
        </div>

        <Link
          href="/network"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
        >
          Explore graph
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </WidgetCard>
  );
}

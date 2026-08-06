import Link from "next/link";
import { Network } from "lucide-react";
import WidgetCard from "./WidgetCard";

export default function KnowledgeGraphWidget() {
  return (
    <WidgetCard
      title="Knowledge Graph"
      icon={Network}
      action={{ label: "Explore graph", href: "/network" }}
    >
      <div className="flex flex-col items-center justify-center py-4 gap-3">
        {/* Node graphic */}
        <div className="relative h-24 w-24" aria-hidden="true">
          <svg viewBox="0 0 96 96" className="h-24 w-24">
            {/* Connecting lines */}
            <line x1="48" y1="48" x2="18" y2="22" stroke="rgba(34,211,238,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="48" y1="48" x2="78" y2="22" stroke="rgba(34,211,238,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="48" y1="48" x2="14" y2="68" stroke="rgba(34,211,238,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="48" y1="48" x2="82" y2="68" stroke="rgba(34,211,238,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Outer nodes */}
            <circle cx="18" cy="22" r="5" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" />
            <circle cx="78" cy="22" r="5" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" />
            <circle cx="14" cy="68" r="5" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" />
            <circle cx="82" cy="68" r="5" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" />
            {/* Center node */}
            <circle cx="48" cy="48" r="12" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" />
            <circle cx="48" cy="48" r="5" fill="rgba(34,211,238,0.5)" />
          </svg>
        </div>
        <div className="text-center space-y-1 max-w-[200px]">
          <p className="text-xs font-medium text-slate-300">Your professional network graph</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Connects your skills, experiences, and relationships into a visual career map. Populates as you build your profile.
          </p>
        </div>
        <Link
          href="/network"
          className="mt-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:text-cyan-300"
        >
          Coming soon — learn more →
        </Link>
      </div>
    </WidgetCard>
  );
}

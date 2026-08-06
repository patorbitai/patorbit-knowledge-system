import Link from "next/link";
import { FileEdit, BadgeCheck, Share2, Sparkles } from "lucide-react";
import WidgetCard from "./WidgetCard";

const ACTIONS = [
  { label: "Edit Resume", href: "/resume-builder", icon: FileEdit },
  { label: "Verify Credential", href: "/trust", icon: BadgeCheck },
  { label: "Share Passport", href: "/passport", icon: Share2 },
  { label: "AI Review", href: "/ai", icon: Sparkles },
];

export default function QuickActionsWidget() {
  return (
    <WidgetCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/[0.06] focus-visible:outline-none focus-visible:border-cyan-500/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 transition-colors group-hover:text-cyan-300">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-medium text-slate-400 transition-colors group-hover:text-slate-200">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </WidgetCard>
  );
}

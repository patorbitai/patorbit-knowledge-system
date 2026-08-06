import { ShieldCheck } from "lucide-react";
import WidgetCard from "./WidgetCard";
import EmptyState from "./EmptyState";

export default function TrustWidget() {
  return (
    <WidgetCard
      title="Trust Score"
      icon={ShieldCheck}
      action={{ label: "View trust", href: "/trust" }}
    >
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <span className="text-2xl font-bold text-slate-600">—</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            No score
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Your trust score is built from verified credentials, claims, and
          evidence. Complete verification to establish your score.
        </p>
      </div>
      <div className="mt-4">
        <EmptyState
          title="No trust data yet"
          description="Verify your credentials to start building a trustworthy profile."
          cta={{ label: "Verify credentials", href: "/trust" }}
        />
      </div>
    </WidgetCard>
  );
}

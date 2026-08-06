import { IdCard } from "lucide-react";
import WidgetCard from "./WidgetCard";
import EmptyState from "./EmptyState";

export default function PassportWidget() {
  return (
    <WidgetCard
      title="Professional Passport"
      icon={IdCard}
      action={{ label: "View passport", href: "/passport" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs leading-relaxed text-slate-500">
            Your passport packages verified claims and evidence into a
            shareable, tamper-evident profile.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.05] text-[10px] font-bold text-slate-500">
              0
            </span>
            <span className="text-[11px] text-slate-500">verified claims</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <EmptyState
          title="Passport is empty"
          description="Verified claims will appear here and become shareable."
          cta={{ label: "Open passport", href: "/passport" }}
        />
      </div>
    </WidgetCard>
  );
}

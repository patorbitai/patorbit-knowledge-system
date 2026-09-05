import Link from "next/link";
import { IdCard, ArrowRight, ShieldCheck } from "lucide-react";
import WidgetCard from "./WidgetCard";

export default function PassportWidget() {
  return (
    <WidgetCard
      title="Professional Passport"
      icon={IdCard}
      action={{ label: "View passport", href: "/passport" }}
    >
      <div className="space-y-3">
        <p className="text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
          Your passport packages verified claims and evidence into a
          shareable, tamper-evident profile.
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04] px-3 py-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-blue-500 text-[9px] font-bold text-white">
              0
            </span>
            <span className="text-[10px] font-medium text-gray-500 dark:text-slate-400">verified claims</span>
          </div>
        </div>

        {/* Empty state */}
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-5 text-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/15 dark:to-blue-500/15 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          </div>
          <p className="text-[11px] font-medium text-gray-600 dark:text-slate-300">
            Build your Professional Passport
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 leading-relaxed">
            Bring your experience, skills and career history together into a shareable professional identity.
          </p>
          <Link
            href="/passport"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
          >
            Open passport
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </WidgetCard>
  );
}

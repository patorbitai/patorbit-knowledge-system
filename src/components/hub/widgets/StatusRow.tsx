import Link from "next/link";
import { IdCard, ShieldCheck, FileText } from "lucide-react";
import type { IdentityScoreData } from "@/lib/identity-score";

type Props = { data: IdentityScoreData };

const CARDS = [
  {
    key: "passport",
    icon: IdCard,
    label: "Career Passport",
    getValue: (d: IdentityScoreData) =>
      d.passportClaims === 0 ? "Not started" : `${d.passportClaims} claim${d.passportClaims === 1 ? "" : "s"}`,
    getStatus: (d: IdentityScoreData) => (d.passportClaims > 0 ? "active" : "empty") as "active" | "empty",
    cta: "Build passport",
    href: "/passport",
  },
  {
    key: "trust",
    icon: ShieldCheck,
    label: "Trust Score",
    getValue: (d: IdentityScoreData) =>
      d.verifiedCredentials === 0 ? "Not established" : `${d.verifiedCredentials} verified`,
    getStatus: (d: IdentityScoreData) => (d.verifiedCredentials > 0 ? "active" : "empty") as "active" | "empty",
    cta: "Start verification",
    href: "/trust",
  },
  {
    key: "resume",
    icon: FileText,
    label: "Resume",
    getValue: (d: IdentityScoreData) =>
      d.resumeCompleteness === 0 ? "Not started" : `${d.resumeCompleteness}% complete`,
    getStatus: (d: IdentityScoreData) => (d.resumeCompleteness > 0 ? "active" : "empty") as "active" | "empty",
    cta: "Start building",
    href: "/resume-builder",
  },
] as const;

export default function StatusRow({ data }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="list" aria-label="Identity status">
      {CARDS.map(({ key, icon: Icon, label, getValue, getStatus, cta, href }) => {
        const status = getStatus(data);
        const value = getValue(data);
        return (
          <div
            key={key}
            role="listitem"
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#080C18] px-4 py-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  status === "active"
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "bg-white/[0.04] text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">{label}</p>
                <p className={`text-sm font-semibold truncate ${status === "active" ? "text-white" : "text-slate-500"}`}>
                  {value}
                </p>
              </div>
            </div>
            <Link
              href={href}
              className="shrink-0 text-xs font-medium text-slate-500 transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:text-cyan-400"
            >
              {cta} →
            </Link>
          </div>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type ComingSoonProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  capabilities?: string[];
};

export default function ComingSoon({
  title,
  description,
  icon: Icon,
  capabilities = [],
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-400">
        {description}
      </p>

      {capabilities.length > 0 && (
        <ul className="mt-2 flex flex-wrap justify-center gap-2">
          {capabilities.map((c) => (
            <li
              key={c}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400"
            >
              {c}
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/solutions"
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-400/30 hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}

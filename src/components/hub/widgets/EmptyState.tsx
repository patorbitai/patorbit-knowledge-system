import Link from "next/link";
import { clsx } from "clsx";

type EmptyStateProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center",
        className
      )}
    >
      {Icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-slate-500">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

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
        "flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] px-4 py-6 text-center",
        className
      )}
    >
      {Icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/15 dark:to-cyan-500/15">
          <Icon className="h-4 w-4 text-blue-500 dark:text-cyan-400" />
        </span>
      )}
      <div>
        <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-gray-400 dark:text-slate-500">
          {description}
        </p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-cyan-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-cyan-300 transition-colors hover:bg-blue-100 dark:hover:bg-cyan-500/20"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

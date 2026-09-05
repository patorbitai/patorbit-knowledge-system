"use client";

import Link from "next/link";
import { clsx } from "clsx";

type EmptyStateProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta?: { label: string; href: string; onClick?: never } | { label: string; onClick: () => void; href?: never };
  secondaryCta?: { label: string; href: string } | { label: string; onClick: () => void };
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  secondaryCta,
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
      <div className="flex items-center gap-2 mt-0.5">
        {cta && "href" in cta && cta.href && (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-cyan-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-cyan-300 transition-colors hover:bg-blue-100 dark:hover:bg-cyan-500/20"
          >
            {cta.label}
          </Link>
        )}
        {cta && "onClick" in cta && cta.onClick && (
          <button
            onClick={cta.onClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-cyan-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-cyan-300 transition-colors hover:bg-blue-100 dark:hover:bg-cyan-500/20 cursor-pointer"
          >
            {cta.label}
          </button>
        )}
        {secondaryCta && "href" in secondaryCta && secondaryCta.href && (
          <Link
            href={secondaryCta.href}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium text-gray-600 dark:text-slate-400 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          >
            {secondaryCta.label}
          </Link>
        )}
        {secondaryCta && "onClick" in secondaryCta && secondaryCta.onClick && (
          <button
            onClick={secondaryCta.onClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium text-gray-600 dark:text-slate-400 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            {secondaryCta.label}
          </button>
        )}
      </div>
    </div>
  );
}

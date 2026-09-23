import Link from "next/link";
import { clsx } from "clsx";

type WidgetCardProps = {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: { label: string; href: string };
  className?: string;
  children: React.ReactNode;
};

export default function WidgetCard({
  title,
  icon: Icon,
  action,
  className,
  children,
}: WidgetCardProps) {
  return (
    <section
      className={clsx(
        "flex flex-col rounded-xl border border-subtle bg-surface p-5",
        className
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <h2 className="text-card text-ink">{title}</h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-label font-medium text-ink-secondary transition-colors hover:text-brand"
          >
            {action.label} →
          </Link>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

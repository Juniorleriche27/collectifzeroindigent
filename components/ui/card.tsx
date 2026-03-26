import * as React from "react";

import { cn } from "@/lib/utils";

/* ── Base Card ──────────────────────────────────────── */
export function Card({
  className,
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft",
        hover && "card-hover cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

/* ── Stat Card ──────────────────────────────────────── */
export function StatCard({
  label,
  value,
  trend,
  icon,
  accent = "primary",
  className,
}: {
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
  accent?: "primary" | "success" | "warning" | "danger" | "purple" | "indigo";
  className?: string;
}) {
  const accentMap = {
    primary: { bar: "gradient-primary", icon: "bg-primary/10 text-primary",        val: "text-primary"      },
    success: { bar: "gradient-success", icon: "bg-emerald-100 text-emerald-600",   val: "text-emerald-700"  },
    warning: { bar: "gradient-warning", icon: "bg-amber-100 text-amber-600",       val: "text-amber-700"    },
    danger:  { bar: "gradient-danger",  icon: "bg-red-100 text-red-600",           val: "text-red-700"      },
    purple:  { bar: "gradient-purple",  icon: "bg-violet-100 text-violet-600",     val: "text-violet-700"   },
    indigo:  { bar: "gradient-indigo",  icon: "bg-indigo-100 text-indigo-600",     val: "text-indigo-700"   },
  };
  const c = accentMap[accent];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-soft",
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
        className,
      )}
    >
      <div className={cn("h-1 w-full", c.bar)} />
      <div className="flex items-start justify-between p-5">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{label}</p>
          <p className={cn("mt-2 text-4xl font-bold tracking-tight", c.val)}>{value}</p>
          {trend ? <p className="mt-1.5 text-xs text-muted">{trend}</p> : null}
        </div>
        {icon ? (
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", c.icon)}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Card Title ─────────────────────────────────────── */
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

/* ── Card Description ───────────────────────────────── */
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

/* ── Page Header ────────────────────────────────────── */
export function PageHeader({
  label,
  title,
  description,
  children,
  className,
}: {
  label?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        {label ? (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{label}</p>
        ) : null}
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-3">{children}</div> : null}
    </div>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "primary" | "purple" | "indigo";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  primary: "bg-primary/10 text-primary ring-1 ring-primary/20",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  danger:  "bg-red-50 text-red-700 ring-1 ring-red-200",
  purple:  "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  indigo:  "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        badgeStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

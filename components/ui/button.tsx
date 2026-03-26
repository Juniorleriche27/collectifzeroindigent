import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type ButtonSize = "xs" | "sm" | "default" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "gradient-primary text-white shadow-sm hover:opacity-90 hover:shadow-md active:scale-[0.98] focus-visible:ring-primary/40",
  secondary:
    "bg-surface-elevated text-foreground ring-1 ring-border shadow-xs hover:bg-muted-surface hover:ring-primary/30 active:scale-[0.98] focus-visible:ring-primary/30",
  ghost:
    "bg-transparent text-foreground hover:bg-muted-surface active:scale-[0.98] focus-visible:ring-primary/30",
  danger:
    "bg-danger text-white shadow-sm hover:opacity-90 hover:shadow-md active:scale-[0.98] focus-visible:ring-danger/40",
  success:
    "gradient-success text-white shadow-sm hover:opacity-90 hover:shadow-md active:scale-[0.98] focus-visible:ring-emerald-400/40",
  outline:
    "border border-primary text-primary bg-transparent hover:bg-primary-subtle active:scale-[0.98] focus-visible:ring-primary/30",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs:      "h-7  rounded-lg px-2.5 text-xs",
  sm:      "h-9  rounded-xl px-3.5 text-sm",
  default: "h-10 rounded-xl px-4",
  lg:      "h-11 rounded-xl px-6 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 text-sm font-semibold",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-4",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";

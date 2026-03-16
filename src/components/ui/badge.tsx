import { cn } from "@/src/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-foreground border-transparent",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  outline: "bg-transparent text-foreground border-border",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}


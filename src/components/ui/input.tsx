import { cn } from "@/src/lib/utils";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; // kept for backwards-compat; used as placeholder
  error?: string;
}

export function Input({
  label,
  error,
  className,
  placeholder,
  ...props
}: InputProps) {
  const effectivePlaceholder = label ?? placeholder;

  return (
    <div className="relative">
      <input
        className={cn(
          "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/10 transition focus:border-primary focus:ring-2 placeholder:text-muted-foreground",
          error &&
            "border-destructive focus:border-destructive focus:ring-destructive/20",
          className
        )}
        placeholder={effectivePlaceholder}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}


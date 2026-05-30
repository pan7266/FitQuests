import type { PropsWithChildren } from "react";
import { cn } from "../../utils/classNames";

interface GlassCardProps extends PropsWithChildren {
  className?: string;
  as?: "section" | "article" | "div";
}

export function GlassCard({ children, className, as = "section" }: GlassCardProps) {
  const Component = as;

  return (
    <Component className={cn("app-card rounded-[1.75rem] p-4", className)}>{children}</Component>
  );
}

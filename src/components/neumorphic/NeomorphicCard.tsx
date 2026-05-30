import type { PropsWithChildren } from "react";
import { cn } from "../../utils/classNames";

interface NeomorphicCardProps extends PropsWithChildren {
  className?: string;
  as?: "section" | "article" | "div";
}

export function NeomorphicCard({ children, className, as = "section" }: NeomorphicCardProps) {
  const Component = as;

  return (
    <Component className={cn("app-card rounded-[1.75rem] p-4", className)}>{children}</Component>
  );
}

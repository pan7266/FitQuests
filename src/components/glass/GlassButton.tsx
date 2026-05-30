import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../utils/classNames";
import { buttonBaseClass, buttonVariantClass } from "../controls/Button";

interface GlassButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function GlassButton({
  children,
  className,
  variant = "secondary",
  type = "button",
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={cn(buttonBaseClass, buttonVariantClass[variant], className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

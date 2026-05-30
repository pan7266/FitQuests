import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../utils/classNames";
import { buttonBaseClass, buttonVariantClass } from "../controls/Button";

interface NeomorphicButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function NeomorphicButton({
  children,
  className,
  variant = "secondary",
  type = "button",
  ...props
}: NeomorphicButtonProps) {
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

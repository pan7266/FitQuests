import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../utils/classNames";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export const buttonBaseClass =
  "tap-feedback focus-ring min-h-11 rounded-2xl px-4 py-2 font-semibold transition disabled:opacity-45";

export const buttonVariantClass = {
  primary: "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]",
  secondary: "app-inset text-app hover:bg-[var(--hover-soft)]",
  danger: "bg-[var(--danger)] text-white",
  ghost: "text-app hover:bg-[var(--hover-soft)]"
};

export function PrimaryButton({ children, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonBaseClass, buttonVariantClass.primary, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonBaseClass, buttonVariantClass.secondary, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonBaseClass, buttonVariantClass.danger, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "tap-feedback focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-app transition hover:bg-[var(--hover-soft)] disabled:opacity-45",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

interface SelectableButtonProps extends ButtonProps {
  selected?: boolean;
}

export function TileButton({
  children,
  className,
  selected = false,
  type = "button",
  ...props
}: SelectableButtonProps) {
  return (
    <button
      className={cn(
        "tile-button focus-ring app-card relative text-left transition hover:-translate-y-0.5 disabled:opacity-45",
        selected && "accent-selected",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function OptionCard({
  children,
  className,
  selected = false,
  type = "button",
  ...props
}: SelectableButtonProps) {
  return (
    <button
      className={cn(
        "option-card focus-ring rounded-2xl p-3 text-left transition hover:bg-[var(--hover-soft)] disabled:opacity-45",
        selected ? "accent-selected" : "app-inset",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

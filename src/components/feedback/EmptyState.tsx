import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { NeomorphicButton } from "../neumorphic/NeomorphicButton";

interface EmptyStateProps {
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  icon
}: EmptyStateProps) {
  return (
    <section className="app-card rounded-[1.75rem] p-6 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]"
      >
        {icon ?? <Sparkles size={26} />}
      </div>
      <h2 className="text-xl font-bold text-[#F8FAFC]">{title}</h2>
      <p className="mx-auto mt-2 max-w-72 text-sm leading-6 text-[#94A3B8]">{description}</p>
      <div className="mt-5 flex flex-col gap-3">
        <NeomorphicButton onClick={onPrimary} variant="primary">
          {primaryLabel}
        </NeomorphicButton>
        {secondaryLabel && onSecondary ? (
          <NeomorphicButton onClick={onSecondary} variant="ghost">
            {secondaryLabel}
          </NeomorphicButton>
        ) : null}
      </div>
    </section>
  );
}

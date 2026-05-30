import { useEffect, useState } from "react";
import type { RestTimerState } from "../../db/schema";
import { formatDuration } from "../../utils/dates";
import { getTimerSnapshot } from "../../utils/timers";
import { NeomorphicButton } from "../neumorphic/NeomorphicButton";

interface RestTimerProps {
  restTimer: RestTimerState;
  onAdd: () => void;
  onSubtract: () => void;
  onCancel: () => void;
  onContinue: () => void;
  onComplete?: () => void;
}

export function RestTimer({
  restTimer,
  onAdd,
  onSubtract,
  onCancel,
  onContinue,
  onComplete
}: RestTimerProps) {
  const [now, setNow] = useState(Date.now());
  const snapshot = getTimerSnapshot(restTimer.targetEndAt, now);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 500);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  useEffect(() => {
    if (snapshot.isComplete) {
      onComplete?.();
    }
  }, [snapshot.isComplete, onComplete]);

  return (
    <div className="fixed inset-0 z-40 flex items-center bg-[color-mix(in_srgb,var(--background)_96%,transparent)] p-4">
      <section className="mx-auto w-full max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Rest</p>
        <h2 aria-live="polite" className="text-app mt-3 text-7xl font-black">
          {snapshot.isComplete ? "Done" : formatDuration(snapshot.remainingSeconds)}
        </h2>
        <p className="text-app-muted mt-3 text-sm">
          {snapshot.isComplete
            ? "Rest complete. Visual cue active."
            : "Countdown stays accurate after resume."}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <NeomorphicButton onClick={onSubtract} variant="secondary">
            -15s
          </NeomorphicButton>
          <NeomorphicButton onClick={onAdd} variant="secondary">
            +15s
          </NeomorphicButton>
          <NeomorphicButton onClick={onCancel} variant="ghost">
            Cancel
          </NeomorphicButton>
          <NeomorphicButton onClick={onContinue} variant="primary">
            Continue
          </NeomorphicButton>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { formatDuration } from "../../utils/dates";
import { secondsBetween } from "../../utils/timers";
import { NeomorphicButton } from "../neumorphic/NeomorphicButton";

interface TimedSetTimerProps {
  startTimestamp: number;
  onStart: () => void;
  onStop: () => void;
}

export function TimedSetTimer({ startTimestamp, onStart, onStop }: TimedSetTimerProps) {
  const [now, setNow] = useState(Date.now());
  const isRunning = startTimestamp > 0;
  const startedAt = useMemo(
    () => (isRunning ? new Date(startTimestamp).toISOString() : undefined),
    [isRunning, startTimestamp]
  );
  const elapsed = startedAt ? secondsBetween(startedAt, new Date(now).toISOString()) : 0;

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

  return (
    <section aria-label="Timed set timer" className="app-inset rounded-full p-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94A3B8]">Timed Set</p>
      <p className="mt-2 text-6xl font-black text-[#F8FAFC]">{formatDuration(elapsed)}</p>
      <div className="mt-5">
        {isRunning ? (
          <NeomorphicButton onClick={onStop} variant="primary">
            Stop
          </NeomorphicButton>
        ) : (
          <NeomorphicButton onClick={onStart} variant="primary">
            Start
          </NeomorphicButton>
        )}
      </div>
    </section>
  );
}

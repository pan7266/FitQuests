import type { ActiveWorkoutDraft, Activity } from "../../db/schema";
import { formatDurationWords } from "../../utils/dates";
import { secondsBetween } from "../../utils/timers";
import { NeomorphicButton } from "../neumorphic/NeomorphicButton";

interface ResumeWorkoutPromptProps {
  draft: ActiveWorkoutDraft;
  activity?: Activity | undefined;
  onResume: () => void;
  onDiscard: () => void;
}

export function ResumeWorkoutPrompt({
  draft,
  activity,
  onResume,
  onDiscard
}: ResumeWorkoutPromptProps) {
  const elapsed = secondsBetween(draft.startedAt, new Date().toISOString());
  const cardioRunningSeconds = draft.cardioTimerStartedAt
    ? secondsBetween(draft.cardioTimerStartedAt, new Date().toISOString())
    : 0;
  const cardioDuration =
    (draft.cardioAccumulatedSeconds ?? draft.cardioDurationSeconds ?? 0) + cardioRunningSeconds;
  const savedDetail =
    draft.mode === "cardio"
      ? `${((draft.cardioDistanceMeters ?? 0) / 1000).toFixed(2)} km, ${formatDurationWords(
          cardioDuration
        )} recorded`
      : `${draft.sets.length} sets saved`;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/62 p-4 pb-[calc(var(--safe-bottom)+1rem)] backdrop-blur-sm">
      <section
        aria-labelledby="resume-title"
        className="app-card mx-auto w-full max-w-md rounded-[1.75rem] p-5"
      >
        <p className="text-sm font-semibold text-[var(--accent)]">
          {activity?.name ?? "Workout"} · {draft.mode}
        </p>
        <h2 className="mt-1 text-xl font-black text-[#F8FAFC]" id="resume-title">
          Resume unfinished workout?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
          {savedDetail}, {formatDurationWords(elapsed)} elapsed. Discard only removes the active
          draft.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <NeomorphicButton onClick={onDiscard} variant="secondary">
            Discard
          </NeomorphicButton>
          <NeomorphicButton onClick={onResume} variant="primary">
            Resume
          </NeomorphicButton>
        </div>
      </section>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIcon } from "../../components/activity/ActivityIcon";
import { ActivityTileSelector } from "../../components/activity/ActivityTileSelector";
import { NeomorphicButton } from "../../components/neumorphic/NeomorphicButton";
import { ProfileHeroSection } from "../../components/profile/ProfileHeroSection";
import { RestTimer } from "../../components/workout/RestTimer";
import { TimedSetTimer } from "../../components/workout/TimedSetTimer";
import { WorkoutCounter } from "../../components/workout/WorkoutCounter";
import { WorkoutSummary } from "../../components/workout/WorkoutSummary";
import { listActivities } from "../../db/repositories/activitiesRepo";
import { listAdventureState, upgradeHeroSkill } from "../../db/repositories/adventureRepo";
import { listSummaries } from "../../db/repositories/summariesRepo";
import { deleteWorkout } from "../../db/repositories/workoutsRepo";
import type { Activity, DailyActivitySummary, HeroProgress, HeroSkill } from "../../db/schema";
import { useAppStore } from "../../stores/appStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useWorkoutStore } from "../../stores/workoutStore";
import { formatDuration, formatDurationWords } from "../../utils/dates";
import { triggerHaptic } from "../../utils/haptics";
import { translate } from "../../utils/i18n";
import { playBeep, unlockAudio } from "../../utils/sounds";
import { calculateDailyGoalMultiplierXP } from "../../utils/stats";
import { secondsBetween } from "../../utils/timers";
import { WorkoutEditor } from "./WorkoutEditor";

const sumSets = (sets: Array<{ value: number }>) =>
  sets.reduce((total, set) => total + set.value, 0);

const getModeForActivity = (activity: Activity) => {
  if (activity.activityType === "cardio") {
    return "cardio" as const;
  }
  if (activity.activityType === "timed") {
    return "timed" as const;
  }

  return "live" as const;
};

export function WorkoutScreen() {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const requestedActivityId = useAppStore((state) => state.selectedActivityId);
  const settings = useSettingsStore((state) => state.settings);
  const draft = useWorkoutStore((state) => state.draft);
  const summary = useWorkoutStore((state) => state.summary);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const addRep = useWorkoutStore((state) => state.addRep);
  const undoLiveRep = useWorkoutStore((state) => state.undoLiveRep);
  const deleteLastSet = useWorkoutStore((state) => state.deleteLastSet);
  const completeCurrentLiveSet = useWorkoutStore((state) => state.completeCurrentLiveSet);
  const saveManualSet = useWorkoutStore((state) => state.saveManualSet);
  const startTimedSet = useWorkoutStore((state) => state.startTimedSet);
  const stopTimedSet = useWorkoutStore((state) => state.stopTimedSet);
  const updateCardioMetrics = useWorkoutStore((state) => state.updateCardioMetrics);
  const startCardioTimer = useWorkoutStore((state) => state.startCardioTimer);
  const pauseCardioTimer = useWorkoutStore((state) => state.pauseCardioTimer);
  const startRest = useWorkoutStore((state) => state.startRest);
  const adjustRest = useWorkoutStore((state) => state.adjustRest);
  const cancelRest = useWorkoutStore((state) => state.cancelRest);
  const updateNotes = useWorkoutStore((state) => state.updateNotes);
  const endWorkout = useWorkoutStore((state) => state.endWorkout);
  const setSummary = useWorkoutStore((state) => state.setSummary);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summaries, setSummaries] = useState<DailyActivitySummary[]>([]);
  const [heroProgress, setHeroProgress] = useState<HeroProgress | undefined>();
  const [heroSkills, setHeroSkills] = useState<HeroSkill[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [manualSetValue, setManualSetValue] = useState("");
  const [manualWeightKg, setManualWeightKg] = useState("");
  const [manualTimedValue, setManualTimedValue] = useState("");
  const [cardioDistanceKm, setCardioDistanceKm] = useState("");
  const [cardioDurationMinutes, setCardioDurationMinutes] = useState("");
  const [cardioSpeed, setCardioSpeed] = useState("");
  const [cardioIncline, setCardioIncline] = useState("");
  const [cardioHeartRate, setCardioHeartRate] = useState("");
  const [cardioEffort, setCardioEffort] = useState<number | undefined>();
  const [pulseKey, setPulseKey] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [restNotifiedTarget, setRestNotifiedTarget] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);
  const [deleteSummaryPending, setDeleteSummaryPending] = useState(false);
  const [pendingSetDelete, setPendingSetDelete] = useState(false);
  const [inlineMessage, setInlineMessage] = useState("");
  const t = (key: string) => translate(settings?.appLanguage ?? "en", key);

  useEffect(() => {
    const load = async () => {
      const [nextActivities, nextSummaries, adventure] = await Promise.all([
        listActivities(),
        listSummaries(),
        listAdventureState()
      ]);
      setActivities(nextActivities);
      setSummaries(nextSummaries);
      setHeroProgress(adventure.hero);
      setHeroSkills(adventure.skills);
      setSelectedActivityId(requestedActivityId === "all" ? "" : requestedActivityId);
    };

    void load();
  }, [requestedActivityId]);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const activeActivity = activities.find((activity) => activity.id === draft?.activityId);

  useEffect(() => {
    if (draft?.mode !== "cardio") {
      return;
    }
    setCardioDistanceKm(((draft.cardioDistanceMeters ?? 0) / 1000).toString());
    setCardioDurationMinutes(((draft.cardioDurationSeconds ?? 0) / 60).toString());
    setCardioSpeed(draft.cardioAverageSpeedKmh?.toString() ?? "");
    setCardioIncline(draft.cardioInclinePercent?.toString() ?? "");
    setCardioHeartRate(draft.cardioAverageHeartRate?.toString() ?? "");
    setCardioEffort(draft.cardioPerceivedEffort);
  }, [
    draft?.cardioAverageSpeedKmh,
    draft?.cardioAverageHeartRate,
    draft?.cardioDistanceMeters,
    draft?.cardioDurationSeconds,
    draft?.cardioInclinePercent,
    draft?.cardioPerceivedEffort,
    draft?.mode
  ]);

  useEffect(() => {
    if (draft?.mode === "cardio" && !draft.cardioTimerStartedAt) {
      setCardioDurationMinutes(((draft.cardioDurationSeconds ?? 0) / 60).toString());
    }
  }, [draft?.cardioDurationSeconds, draft?.cardioTimerStartedAt, draft?.mode]);

  const handleSetCompleteFeedback = useCallback(() => {
    triggerHaptic(Boolean(settings?.hapticsEnabled), [20, 30, 20]);
    playBeep(Boolean(settings?.soundEnabled), "setComplete");
  }, [settings?.hapticsEnabled, settings?.soundEnabled]);

  const maybeAutoRest = async (activity: Activity | undefined) => {
    if (activity?.autoRestEnabled) {
      await startRest(activity.defaultRestSeconds);
    }
  };

  const completedTotal = draft ? sumSets(draft.sets) : 0;
  const isStrengthWorkout = activeActivity?.activityType === "strength";
  const cardioRunningSeconds =
    draft?.mode === "cardio" && draft.cardioTimerStartedAt
      ? secondsBetween(draft.cardioTimerStartedAt, new Date(now).toISOString())
      : 0;
  const cardioDurationSeconds =
    draft?.mode === "cardio"
      ? (draft.cardioAccumulatedSeconds ?? draft.cardioDurationSeconds ?? 0) + cardioRunningSeconds
      : 0;
  const currentTotal =
    draft && isStrengthWorkout ? completedTotal + draft.currentSetValue : completedTotal;
  const bestSet = draft
    ? Math.max(
        draft.currentSetValue > 0 && isStrengthWorkout ? draft.currentSetValue : 0,
        ...draft.sets.map((set) => set.value),
        0
      )
    : 0;
  const elapsed = draft ? secondsBetween(draft.startedAt, new Date(now).toISOString()) : 0;
  const valueLabel =
    activeActivity?.unit === "seconds"
      ? "seconds"
      : activeActivity?.unit === "distance"
        ? "km"
        : "reps";
  const displayTotal =
    activeActivity?.unit === "seconds"
      ? formatDuration(currentTotal)
      : activeActivity?.unit === "distance"
        ? `${((draft?.cardioDistanceMeters ?? 0) / 1000).toFixed(2)} km`
        : `${currentTotal} reps`;
  const cardioPace =
    draft?.cardioDistanceMeters && draft.cardioDistanceMeters > 0
      ? cardioDurationSeconds / (draft.cardioDistanceMeters / 1000)
      : 0;
  const computedCardioSpeed =
    draft?.cardioDistanceMeters && draft.cardioDistanceMeters > 0 && cardioDurationSeconds > 0
      ? draft.cardioDistanceMeters / 1000 / (cardioDurationSeconds / 3600)
      : (draft?.cardioAverageSpeedKmh ?? 0);
  const workoutXpEstimate = activeActivity
    ? activeActivity.activityType === "cardio"
      ? calculateDailyGoalMultiplierXP({
          unit: activeActivity.unit,
          metricValue: draft?.cardioDistanceMeters ?? 0,
          dailyGoal: activeActivity.dailyGoal,
          dailyTotalBefore: 0
        })
      : calculateDailyGoalMultiplierXP({
          unit: activeActivity.unit,
          metricValue: currentTotal,
          dailyGoal: activeActivity.dailyGoal,
          dailyTotalBefore: 0
        })
    : 0;
  const manualSetXP =
    Number.isFinite(Number(manualSetValue)) && Number(manualSetValue) > 0
      ? calculateDailyGoalMultiplierXP({
          unit: "reps",
          metricValue: Number(manualSetValue),
          dailyGoal: activeActivity?.dailyGoal ?? 0,
          dailyTotalBefore: currentTotal
        })
      : 0;

  const handleRepTap = async () => {
    await unlockAudio();
    await addRep();
    triggerHaptic(Boolean(settings?.hapticsEnabled));
    playBeep(Boolean(settings?.soundEnabled), "rep");
    setPulseKey((current) => current + 1);
  };

  const handleLiveUndo = async () => {
    const result = await undoLiveRep();
    if (result === "needs-confirmation") {
      setPendingSetDelete(true);
    }
  };

  const handleCompleteLiveSet = async () => {
    const reps = draft?.currentSetValue ?? 0;
    if (reps <= 0) {
      setInlineMessage("Add at least 1 rep before completing a set.");
      return;
    }
    await unlockAudio();
    await completeCurrentLiveSet();
    setInlineMessage("");
    handleSetCompleteFeedback();
    await maybeAutoRest(activeActivity);
  };

  const handleSaveManualSet = async () => {
    const value = Number(manualSetValue);
    if (!Number.isFinite(value) || value <= 0) {
      setInlineMessage("Enter reps before saving a set.");
      return;
    }
    await unlockAudio();
    const parsedWeight = Number(manualWeightKg);
    await saveManualSet(
      value,
      undefined,
      undefined,
      activeActivity?.unit === "weight" && Number.isFinite(parsedWeight) && parsedWeight > 0
        ? parsedWeight
        : undefined
    );
    setManualSetValue("");
    setManualWeightKg("");
    setInlineMessage("");
    handleSetCompleteFeedback();
    await maybeAutoRest(activeActivity);
  };

  const handleSaveTimedManual = async () => {
    const value = Number(manualTimedValue);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    await unlockAudio();
    await saveManualSet(value);
    setManualTimedValue("");
    handleSetCompleteFeedback();
    await maybeAutoRest(activeActivity);
  };

  const handleStopTimedSet = async () => {
    await unlockAudio();
    await stopTimedSet();
    handleSetCompleteFeedback();
    await maybeAutoRest(activeActivity);
  };

  const handleCompleteAction = async () => {
    if (activeActivity?.activityType === "timed") {
      if (draft?.currentSetValue && draft.currentSetValue > 0) {
        await handleStopTimedSet();
        return;
      }
      await handleSaveTimedManual();
      return;
    }

    await handleCompleteLiveSet();
  };

  const handleCardioDistanceChange = async (value: string) => {
    setCardioDistanceKm(value);
    const kilometers = Number(value);
    if (Number.isFinite(kilometers) && kilometers >= 0) {
      await updateCardioMetrics({ distanceMeters: kilometers * 1000 });
    }
  };

  const handleCardioDurationChange = async (value: string) => {
    setCardioDurationMinutes(value);
    const minutes = Number(value);
    if (Number.isFinite(minutes) && minutes >= 0) {
      await updateCardioMetrics({ durationSeconds: minutes * 60 });
    }
  };

  const handleCardioSpeedChange = async (value: string) => {
    setCardioSpeed(value);
    const speed = Number(value);
    if (Number.isFinite(speed) && speed >= 0) {
      await updateCardioMetrics({ averageSpeedKmh: speed });
    }
  };

  const handleCardioInclineChange = async (value: string) => {
    setCardioIncline(value);
    const incline = Number(value);
    if (Number.isFinite(incline) && incline >= 0) {
      await updateCardioMetrics({ inclinePercent: incline });
    }
  };

  const handleCardioHeartRateChange = async (value: string) => {
    setCardioHeartRate(value);
    const heartRate = Number(value);
    if (Number.isFinite(heartRate) && heartRate >= 0) {
      await updateCardioMetrics({ averageHeartRate: heartRate });
    }
  };

  const handleCardioEffortChange = async (value: number) => {
    setCardioEffort(value);
    await updateCardioMetrics({ perceivedEffort: value });
  };

  const handleStartCardioTimer = async () => {
    await unlockAudio();
    await startCardioTimer();
  };

  const handlePauseCardioTimer = async () => {
    await unlockAudio();
    await pauseCardioTimer();
  };

  const handleUndoManual = async () => {
    if (manualSetValue) {
      setManualSetValue("");
      setManualWeightKg("");
      return;
    }
    if (draft?.sets.length) {
      setPendingSetDelete(true);
    }
  };

  const handleUndoTimed = async () => {
    if (draft?.currentSetValue && draft.currentSetValue > 0) {
      return;
    }
    if (manualTimedValue) {
      setManualTimedValue("");
      return;
    }
    if (draft?.sets.length) {
      setPendingSetDelete(true);
    }
  };

  const handleEndWorkout = async () => {
    if (draft?.mode === "live" && draft.currentSetValue > 0) {
      await completeCurrentLiveSet();
    }
    await endWorkout();
    window.dispatchEvent(new Event("fit-quest-adventure-updated"));
  };

  const handleRestComplete = useCallback(() => {
    if (!draft?.restTimer || restNotifiedTarget === draft.restTimer.targetEndAt) {
      return;
    }
    setRestNotifiedTarget(draft.restTimer.targetEndAt);
    triggerHaptic(Boolean(settings?.hapticsEnabled), [40, 50, 40]);
    playBeep(Boolean(settings?.soundEnabled), "restComplete");
  }, [draft?.restTimer, restNotifiedTarget, settings?.hapticsEnabled, settings?.soundEnabled]);

  const summaryActivity = useMemo(
    () => activities.find((activity) => activity.id === summary?.workout.activityId),
    [activities, summary?.workout.activityId]
  );
  const activeSummary = summaries.find(
    (summaryItem) =>
      summaryItem.activityId === activeActivity?.id && summaryItem.localDate === draft?.localDate
  );
  const activeTodayTotal =
    activeActivity?.activityType === "cardio"
      ? (activeSummary?.totalDistanceMeters ?? 0) + (draft?.cardioDistanceMeters ?? 0)
      : activeActivity?.activityType === "timed"
        ? (activeSummary?.totalSeconds ?? 0) + currentTotal
        : (activeSummary?.totalReps ?? 0) + currentTotal;

  if (summary) {
    return (
      <div
        aria-labelledby="workout-summary-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-4 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSummary(undefined);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setSummary(undefined);
          }
        }}
        role="dialog"
        tabIndex={-1}
      >
        <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-auto">
          <div className="mb-2 flex justify-end">
            <button
              aria-label="Close summary"
              className="focus-ring rounded-full bg-[var(--surface)] px-3 py-2 text-app shadow-[var(--shadow-raised)]"
              onClick={() => setSummary(undefined)}
              type="button"
            >
              Close
            </button>
          </div>
          <WorkoutSummary
            activity={summaryActivity}
            cardioMetric={summary.cardioMetric}
            compactEnd
            onDelete={() => setDeleteSummaryPending(true)}
            onDone={() => setSummary(undefined)}
            onEdit={() => setEditingSummary(true)}
            onStartAnother={() => setSummary(undefined)}
            sets={summary.sets}
            workout={summary.workout}
          />
        </div>
        {editingSummary ? (
          <WorkoutEditor
            activity={summaryActivity}
            onClose={() => {
              setEditingSummary(false);
              setSummary(undefined);
            }}
            workoutWithSets={summary}
          />
        ) : null}
        {deleteSummaryPending ? (
          <div
            aria-labelledby="delete-workout-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-5 backdrop-blur-sm"
            role="dialog"
          >
            <div className="app-card max-w-sm rounded-[2rem] p-6">
              <h2 className="text-app text-2xl font-black" id="delete-workout-title">
                Delete workout?
              </h2>
              <p className="text-app-soft mt-2 text-sm leading-6">
                This removes the completed workout and recalculates stats, XP, and Adventure
                progress from your saved history.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <NeomorphicButton
                  onClick={() => setDeleteSummaryPending(false)}
                  variant="secondary"
                >
                  Cancel
                </NeomorphicButton>
                <NeomorphicButton
                  onClick={async () => {
                    await deleteWorkout(summary.workout.id);
                    window.dispatchEvent(new Event("fit-quest-adventure-updated"));
                    setDeleteSummaryPending(false);
                    setSummary(undefined);
                    setActiveTab("progress");
                  }}
                  variant="danger"
                >
                  Delete
                </NeomorphicButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (!draft) {
    return (
      <section className="space-y-4">
        <header>
          <h1 className="text-app text-3xl font-black">{t("common.train")}</h1>
        </header>
        <ProfileHeroSection context="train" variant="compact" />
        <div className="app-card rounded-[1.75rem] p-5">
          <h2 className="text-app text-xl font-black">{t("train.chooseActivity")}</h2>
          <p className="text-app-soft mt-2 text-sm leading-6">
            {t("train.chooseActivityDescription")} {t("train.strengthDescription")}
          </p>
          <div className="mt-5">
            <ActivityTileSelector
              activities={activities}
              summaries={summaries}
              onAddActivity={() => setActiveTab("settings")}
              onChange={(activityId) => {
                setSelectedActivityId(activityId);
              }}
              value={selectedActivityId}
            />
          </div>
        </div>
        <TrainSkillsPanel
          hero={heroProgress}
          onUpgrade={async (slug) => {
            await upgradeHeroSkill(slug);
            const adventure = await listAdventureState();
            setHeroProgress(adventure.hero);
            setHeroSkills(adventure.skills);
            window.dispatchEvent(new Event("fit-quest-adventure-updated"));
          }}
          skills={heroSkills}
          t={t}
        />
        {selectedActivityId ? (
          <div className="sticky bottom-[calc(var(--safe-bottom)+5.5rem)] z-20 mx-auto max-w-md px-1">
            <button
              className="focus-ring min-h-14 w-full rounded-2xl bg-[var(--accent)] px-5 text-base font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
              onClick={async () => {
                const activity = activities.find((item) => item.id === selectedActivityId);
                if (!activity) {
                  return;
                }
                await unlockAudio();
                await startWorkout(activity, getModeForActivity(activity));
              }}
              type="button"
            >
              {t("common.startWorkout")}
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4 lg:space-y-6">
      <section className="app-card rounded-[1.75rem] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
              <ActivityIcon activity={activeActivity} size={24} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--accent)]">
                {activeActivity?.name ?? "Workout"}
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">
                {draft.mode === "cardio" ? "Cardio" : `Set ${draft.sets.length + 1}`} · {draft.mode}
              </h2>
              {activeActivity?.dailyGoal ? (
                <p className="text-app-soft mt-1 text-sm">
                  Today: {formatActivityProgressValue(activeActivity, activeTodayTotal)} /{" "}
                  {formatActivityProgressValue(activeActivity, activeActivity.dailyGoal)}
                </p>
              ) : null}
            </div>
          </div>
          <p className="rounded-2xl bg-[#0B1220] px-3 py-2 text-sm font-bold text-[#CBD5E1]">
            {formatDurationWords(elapsed)}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Total" value={displayTotal} />
          <MiniStat
            label={activeActivity?.unit === "distance" ? "Pace" : "Best"}
            value={
              activeActivity?.unit === "distance"
                ? cardioPace > 0
                  ? `${formatDuration(cardioPace)}/km`
                  : "--"
                : `${bestSet} ${valueLabel}`
            }
          />
          <MiniStat
            label={activeActivity?.unit === "distance" ? "Duration" : "Sets"}
            value={
              activeActivity?.unit === "distance"
                ? formatDuration(cardioDurationSeconds)
                : String(draft.sets.length)
            }
          />
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-[minmax(28rem,1fr)_24rem] xl:grid-cols-[minmax(34rem,1fr)_28rem]">
        <div className="space-y-4 lg:flex lg:min-h-[32rem] lg:flex-col lg:items-center lg:justify-center">
          {isStrengthWorkout ? (
            <section className="grid w-full gap-4 xl:grid-cols-[minmax(18rem,1fr)_minmax(18rem,0.85fr)] xl:items-stretch">
              <div className="app-card flex min-h-[24rem] flex-col items-center justify-center rounded-[1.75rem] p-5">
                <p className="text-app-muted mb-3 text-xs font-bold uppercase tracking-[0.16em]">
                  Live Counter
                </p>
                <WorkoutCounter
                  label="Tap to add one rep"
                  onTap={handleRepTap}
                  onUndo={handleLiveUndo}
                  pulseKey={pulseKey}
                  value={draft.currentSetValue}
                />
                <p className="text-app-soft mt-3 text-sm font-bold">
                  +1 XP per rep · {draft.currentSetValue} reps = {draft.currentSetValue} XP
                </p>
              </div>
              <div className="app-card rounded-[1.75rem] p-5">
                <p className="text-app-muted text-xs font-bold uppercase tracking-[0.16em]">
                  Log Set
                </p>
                <label className="mt-4 block">
                  <span className="text-app-soft mb-2 block text-sm font-bold">Completed reps</span>
                  <input
                    className="focus-ring app-inset min-h-16 w-full rounded-3xl px-5 text-3xl font-black text-app"
                    inputMode="numeric"
                    min={1}
                    onChange={(event) => setManualSetValue(event.target.value)}
                    type="number"
                    value={manualSetValue}
                  />
                </label>
                {activeActivity?.unit === "weight" ? (
                  <label className="mt-4 block">
                    <span className="text-app-soft mb-2 block text-sm font-bold">Weight (kg)</span>
                    <input
                      className="focus-ring app-inset min-h-14 w-full rounded-2xl px-4 text-app"
                      inputMode="decimal"
                      min={0}
                      onChange={(event) => setManualWeightKg(event.target.value)}
                      step="0.5"
                      type="number"
                      value={manualWeightKg}
                    />
                  </label>
                ) : null}
                <p className="text-app-soft mt-3 text-sm font-bold">
                  XP estimate: {manualSetXP} XP
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <NeomorphicButton onClick={handleUndoManual} variant="secondary">
                    Undo
                  </NeomorphicButton>
                  <NeomorphicButton onClick={handleSaveManualSet} variant="primary">
                    Save Set
                  </NeomorphicButton>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <MiniStat label="Workout XP" value={`${workoutXpEstimate} XP`} />
                  <MiniStat label="Best Set" value={`${bestSet} reps`} />
                </div>
              </div>
              {inlineMessage ? (
                <p className="text-app-soft rounded-2xl border border-[var(--warning)]/60 px-4 py-3 text-sm font-bold xl:col-span-2">
                  {inlineMessage}
                </p>
              ) : null}
            </section>
          ) : null}
          {draft.mode === "timed" ? (
            <section className="w-full max-w-xl space-y-4">
              <TimedSetTimer
                onStart={async () => {
                  await unlockAudio();
                  await startTimedSet();
                }}
                onStop={handleStopTimedSet}
                startTimestamp={draft.currentSetValue}
              />
              <div className="app-card rounded-[1.75rem] p-5">
                <label>
                  <span className="mb-2 block text-sm font-bold text-[#CBD5E1]">
                    Manual seconds
                  </span>
                  <input
                    className="focus-ring app-inset min-h-14 w-full rounded-2xl px-4 text-[#F8FAFC]"
                    inputMode="numeric"
                    min={1}
                    onChange={(event) => setManualTimedValue(event.target.value)}
                    type="number"
                    value={manualTimedValue}
                  />
                </label>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <NeomorphicButton
                    disabled={draft.currentSetValue > 0}
                    onClick={handleUndoTimed}
                    variant="secondary"
                  >
                    Undo
                  </NeomorphicButton>
                  <NeomorphicButton onClick={handleSaveTimedManual} variant="primary">
                    Add Set
                  </NeomorphicButton>
                </div>
              </div>
            </section>
          ) : null}
          {draft.mode === "cardio" ? (
            <section className="app-card w-full rounded-[1.75rem] p-5 lg:max-w-2xl">
              <div
                aria-label="Cardio timer"
                className="mx-auto flex h-52 w-52 flex-col items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-inset)] text-center shadow-[var(--shadow-inset)]"
                role="timer"
              >
                <p className="text-app-muted text-xs font-bold uppercase tracking-[0.16em]">
                  Duration
                </p>
                <p className="text-app mt-2 text-5xl font-black">
                  {formatDuration(cardioDurationSeconds)}
                </p>
                <p className="text-app-soft mt-2 text-sm">
                  {draft.cardioTimerStartedAt ? "Running" : "Paused / manual"}
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <NeomorphicButton
                  onClick={
                    draft.cardioTimerStartedAt ? handlePauseCardioTimer : handleStartCardioTimer
                  }
                  variant="primary"
                >
                  {draft.cardioTimerStartedAt
                    ? "Pause"
                    : cardioDurationSeconds > 0
                      ? "Resume"
                      : "Start"}
                </NeomorphicButton>
                <NeomorphicButton onClick={handleEndWorkout} variant="danger">
                  Finish
                </NeomorphicButton>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-app-soft mb-2 block text-sm font-bold">Distance (km)</span>
                  <input
                    className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                    inputMode="decimal"
                    min={0}
                    onChange={(event) => void handleCardioDistanceChange(event.target.value)}
                    step="0.01"
                    type="number"
                    value={cardioDistanceKm}
                  />
                </label>
                <label className="block">
                  <span className="text-app-soft mb-2 block text-sm font-bold">
                    Duration (minutes)
                  </span>
                  <input
                    className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                    disabled={Boolean(draft.cardioTimerStartedAt)}
                    inputMode="decimal"
                    min={0}
                    onChange={(event) => void handleCardioDurationChange(event.target.value)}
                    step="0.1"
                    type="number"
                    value={
                      draft.cardioTimerStartedAt
                        ? (cardioDurationSeconds / 60).toFixed(1)
                        : cardioDurationMinutes
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-app-soft mb-2 block text-sm font-bold">
                    Average speed (km/h)
                  </span>
                  <input
                    className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                    inputMode="decimal"
                    min={0}
                    onChange={(event) => void handleCardioSpeedChange(event.target.value)}
                    placeholder={computedCardioSpeed > 0 ? computedCardioSpeed.toFixed(1) : "Auto"}
                    step="0.1"
                    type="number"
                    value={cardioSpeed}
                  />
                </label>
                <label className="block">
                  <span className="text-app-soft mb-2 block text-sm font-bold">Incline (%)</span>
                  <input
                    className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                    inputMode="decimal"
                    min={0}
                    onChange={(event) => void handleCardioInclineChange(event.target.value)}
                    step="0.1"
                    type="number"
                    value={cardioIncline}
                  />
                </label>
                <label className="block">
                  <span className="text-app-soft mb-2 block text-sm font-bold">
                    Avg heart rate (optional)
                  </span>
                  <input
                    className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-[#F8FAFC]"
                    inputMode="numeric"
                    min={0}
                    onChange={(event) => void handleCardioHeartRateChange(event.target.value)}
                    type="number"
                    value={cardioHeartRate}
                  />
                </label>
                <fieldset className="block">
                  <legend className="text-app-soft mb-2 block text-sm font-bold">
                    Perceived effort
                  </legend>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                      <button
                        aria-pressed={cardioEffort === value}
                        className={`focus-ring min-h-10 rounded-xl text-sm font-black transition ${
                          cardioEffort === value
                            ? "bg-[var(--accent)] text-white shadow-[var(--accent-glow)]"
                            : "app-inset text-[#F8FAFC]"
                        }`}
                        key={value}
                        onClick={() => void handleCardioEffortChange(value)}
                        type="button"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <MiniStat
                  label="Pace"
                  value={cardioPace > 0 ? `${formatDuration(cardioPace)}/km` : "--"}
                />
                <MiniStat
                  label="Speed"
                  value={computedCardioSpeed > 0 ? `${computedCardioSpeed.toFixed(1)} km/h` : "--"}
                />
              </div>
            </section>
          ) : null}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="app-card rounded-[1.75rem] p-4">
            <h3 className="text-app text-lg font-black">
              {draft.mode === "cardio" ? "Session" : "Set List"}
            </h3>
            {draft.mode === "cardio" ? (
              <div className="mt-3 grid gap-2">
                <CardioMetric label="Distance" value={displayTotal} />
                <CardioMetric label="Duration" value={formatDuration(cardioDurationSeconds)} />
                <CardioMetric
                  label="Pace"
                  value={cardioPace > 0 ? `${formatDuration(cardioPace)}/km` : "--"}
                />
                <CardioMetric
                  label="Speed"
                  value={computedCardioSpeed > 0 ? `${computedCardioSpeed.toFixed(1)} km/h` : "--"}
                />
                <CardioMetric
                  label="Incline"
                  value={
                    draft.cardioInclinePercent !== undefined
                      ? `${draft.cardioInclinePercent.toFixed(1)}%`
                      : "--"
                  }
                />
                <CardioMetric
                  label="Heart rate"
                  value={
                    draft.cardioAverageHeartRate !== undefined
                      ? `${draft.cardioAverageHeartRate} bpm`
                      : "--"
                  }
                />
                <CardioMetric
                  label="Effort"
                  value={
                    draft.cardioPerceivedEffort !== undefined
                      ? `${draft.cardioPerceivedEffort}/10`
                      : "--"
                  }
                />
              </div>
            ) : (
              <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
                {draft.sets.length === 0 ? (
                  <p className="text-app-soft text-sm">No completed sets yet.</p>
                ) : (
                  draft.sets.map((set) => (
                    <div
                      className="app-inset flex justify-between rounded-2xl px-4 py-3"
                      key={set.id}
                    >
                      <span className="text-app-muted">Set {set.setIndex}</span>
                      <span className="text-app font-bold">
                        {activeActivity?.unit === "seconds"
                          ? formatDuration(set.value)
                          : activeActivity?.unit === "weight" && set.weightKg
                            ? `${set.value} x ${set.weightKg} kg`
                            : set.value}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#CBD5E1]">Notes</span>
            <textarea
              className="focus-ring app-inset min-h-28 w-full rounded-2xl p-4 text-[#F8FAFC]"
              onBlur={(event) => void updateNotes(event.target.value)}
              placeholder="Optional"
              defaultValue={draft.notes ?? ""}
            />
          </label>
        </aside>
      </div>
      {draft.mode !== "cardio" ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <NeomorphicButton className="min-h-12" onClick={handleCompleteAction} variant="primary">
            {t("workout.completeSet")}
          </NeomorphicButton>
          <NeomorphicButton
            className="min-h-12"
            onClick={() => {
              void startRest(activeActivity?.defaultRestSeconds ?? 45);
            }}
            variant="secondary"
          >
            {t("workout.rest")}
          </NeomorphicButton>
          <NeomorphicButton
            className="min-h-12"
            onClick={() => void handleEndWorkout()}
            variant="danger"
          >
            {t("workout.end")}
          </NeomorphicButton>
        </div>
      ) : null}
      {draft.restTimer ? (
        <RestTimer
          onAdd={() => void adjustRest(15)}
          onCancel={() => void cancelRest()}
          onComplete={handleRestComplete}
          onContinue={() => void cancelRest()}
          onSubtract={() => void adjustRest(-15)}
          restTimer={draft.restTimer}
        />
      ) : null}
      {pendingSetDelete ? (
        <div
          aria-labelledby="delete-set-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/58 p-5 backdrop-blur-sm"
          role="dialog"
        >
          <div className="app-card max-w-sm rounded-[2rem] p-6">
            <h2 className="text-app text-2xl font-black" id="delete-set-title">
              Delete last set?
            </h2>
            <p className="text-app-soft mt-2 text-sm leading-6">
              This removes the most recent completed set from the active workout.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <NeomorphicButton onClick={() => setPendingSetDelete(false)} variant="secondary">
                Cancel
              </NeomorphicButton>
              <NeomorphicButton
                onClick={async () => {
                  await deleteLastSet();
                  setPendingSetDelete(false);
                }}
                variant="danger"
              >
                Delete
              </NeomorphicButton>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-inset min-w-0 rounded-2xl p-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[#F8FAFC]">{value}</p>
    </div>
  );
}

function CardioMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-inset flex items-center justify-between rounded-2xl px-4 py-3">
      <span className="text-app-muted text-sm font-bold">{label}</span>
      <span className="text-app font-black">{value}</span>
    </div>
  );
}

function formatActivityProgressValue(activity: Activity, value: number) {
  if (activity.activityType === "cardio") {
    return `${(value / 1000).toFixed(1)} km`;
  }
  if (activity.activityType === "timed") {
    return formatDuration(value);
  }
  return `${Math.round(value)} reps`;
}

function TrainSkillsPanel({
  hero,
  skills,
  onUpgrade,
  t
}: {
  hero?: HeroProgress | undefined;
  skills: HeroSkill[];
  onUpgrade: (slug: HeroSkill["slug"]) => Promise<void>;
  t: (key: string) => string;
}) {
  const points = hero?.unspentSkillPoints ?? 0;
  if (!hero && skills.length === 0) {
    return null;
  }

  return (
    <section className="app-card rounded-[1.5rem] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-app text-lg font-black">{t("adventure.upgradeHero")}</h2>
          <p className="text-app-soft mt-0.5 text-xs">{t("adventure.upgradeHeroDescription")}</p>
        </div>
        <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-black text-[var(--accent-contrast)]">
          {points} {t("profile.skillPoints")}
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => (
          <article className="app-inset rounded-2xl p-3" key={skill.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-app font-black">{translateSkillName(skill.slug, t)}</h3>
                <p className="text-app-soft mt-1 text-xs leading-5">
                  {translateSkillDescription(skill.slug, t)}
                </p>
              </div>
              <span className="app-pill">
                {t("profile.level")} {skill.level}
              </span>
            </div>
            <button
              className="focus-ring mt-3 min-h-9 w-full rounded-xl bg-[var(--accent)] px-3 text-xs font-black text-[var(--accent-contrast)] disabled:bg-[var(--toggle-off)] disabled:text-[var(--text-muted)]"
              disabled={points <= 0}
              onClick={() => void onUpgrade(skill.slug)}
              type="button"
            >
              {points > 0 ? t("adventure.upgrade") : t("adventure.noSkillPoints")}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function translateSkillName(slug: HeroSkill["slug"], t: (key: string) => string) {
  const keys: Record<HeroSkill["slug"], string> = {
    power: "adventure.skillPower",
    endurance: "adventure.skillEndurance",
    focus: "adventure.skillFocus",
    agility: "adventure.skillAgility",
    luck: "adventure.skillLuck",
    life: "adventure.skillLife"
  };
  return t(keys[slug]);
}

function translateSkillDescription(slug: HeroSkill["slug"], t: (key: string) => string) {
  const keys: Record<HeroSkill["slug"], string> = {
    power: "adventure.skillPowerDescription",
    endurance: "adventure.skillEnduranceDescription",
    focus: "adventure.skillFocusDescription",
    agility: "adventure.skillAgilityDescription",
    luck: "adventure.skillLuckDescription",
    life: "adventure.skillLifeDescription"
  };
  return t(keys[slug]);
}

import { useEffect, useMemo, useState } from "react";
import { ResumeWorkoutPrompt } from "../components/feedback/ResumeWorkoutPrompt";
import { AppShell } from "../components/layout/AppShell";
import { listActivities, updateActivity } from "../db/repositories/activitiesRepo";
import { selectMobTarget } from "../db/repositories/adventureRepo";
import type { Activity } from "../db/schema";
import { seedAppData } from "../db/seed";
import { AdventureScreen } from "../features/adventure/AdventureScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { ProgressScreen } from "../features/progress/ProgressScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { WorkoutScreen } from "../features/workout/WorkoutScreen";
import { useAppStore } from "../stores/appStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useWorkoutStore } from "../stores/workoutStore";
import { APP_NAME } from "../utils/appIdentity";
import { getAccentStyle } from "../utils/colors";
import { reportTranslationIssuesInDevelopment } from "../utils/i18n";
import { getThemeClassName } from "../utils/theme";
import { getWorkoutTitle } from "../utils/workoutTitles";

export default function App() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const settings = useSettingsStore((state) => state.settings);
  const isSettingsLoaded = useSettingsStore((state) => state.isLoaded);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const draft = useWorkoutStore((state) => state.draft);
  const loadDraft = useWorkoutStore((state) => state.loadDraft);
  const discardDraft = useWorkoutStore((state) => state.discardDraft);
  const setActiveBattle = useAppStore((state) => state.setActiveBattle);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [booted, setBooted] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    const boot = async () => {
      await seedAppData();
      reportTranslationIssuesInDevelopment();
      await loadSettings();
      const activeDraft = await loadDraft();
      setActivities(await listActivities({ includeArchived: true }));
      setShowResumePrompt(Boolean(activeDraft));
      setBooted(true);
    };

    void boot();
  }, [loadDraft, loadSettings]);

  const themeClass = useMemo(
    () =>
      getThemeClassName(
        settings?.uiStyle,
        settings?.colorMode,
        settings?.uiDensity,
        settings?.appLanguage
      ),
    [settings?.uiStyle, settings?.colorMode, settings?.uiDensity, settings?.appLanguage]
  );
  const activeActivity = activities.find((activity) => activity.id === draft?.activityId);
  const appTitle = getWorkoutTitle(
    activeActivity,
    draft?.mode,
    draft?.restTimer ? "rest" : draft ? "active" : "idle"
  );

  useEffect(() => {
    document.title = appTitle || APP_NAME;
  }, [appTitle]);

  const content = () => {
    if (activeTab === "train") {
      return <WorkoutScreen />;
    }
    if (activeTab === "adventure") {
      return <AdventureScreen />;
    }
    if (activeTab === "settings") {
      return <SettingsScreen />;
    }
    if (activeTab === "progress") {
      return <ProgressScreen />;
    }

    return <HomeScreen />;
  };

  if (!booted || !isSettingsLoaded) {
    return (
      <div
        className={`${themeClass} flex min-h-dvh items-center justify-center px-6`}
        style={getAccentStyle(settings?.accentColor)}
      >
        <div className="app-card rounded-[1.75rem] p-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            {APP_NAME}
          </p>
          <p className="text-app-muted mt-2">
            {settings?.appLanguage === "el"
              ? "Φόρτωση τοπικού tracker..."
              : "Loading local tracker..."}
          </p>
        </div>
      </div>
    );
  }

  if (!settings?.onboardingCompleted) {
    return (
      <div className={themeClass} style={getAccentStyle(settings?.accentColor)}>
        <OnboardingScreen
          onComplete={async (setup) => {
            await updateSettings({
              onboardingCompleted: true,
              viewMode: setup.viewMode,
              appLanguage: setup.appLanguage,
              uiStyle: setup.uiStyle,
              colorMode: setup.colorMode,
              accentColor: setup.accentColor,
              displayName: setup.displayName.trim() || "Player",
              ...(setup.weightKg !== undefined ? { weightKg: setup.weightKg } : {}),
              ...(setup.heightCm !== undefined ? { heightCm: setup.heightCm } : {}),
              ...(setup.goalWeightKg !== undefined ? { goalWeightKg: setup.goalWeightKg } : {})
            });
            for (const activity of activities) {
              const goal = setup.dailyGoals[activity.slug];
              if (goal !== undefined) {
                await updateActivity(activity.id, { dailyGoal: goal });
              }
            }
            await selectMobTarget("mob_slime_excuses");
            setActiveBattle({ enemyId: "mob_slime_excuses" });
            setActiveTab("home");
          }}
        />
      </div>
    );
  }

  return (
    <div className={themeClass} style={getAccentStyle(settings.accentColor)}>
      <AppShell activeTab={activeTab} onTabChange={setActiveTab} title={appTitle}>
        {content()}
      </AppShell>
      {showResumePrompt && draft ? (
        <ResumeWorkoutPrompt
          activity={activities.find((activity) => activity.id === draft.activityId)}
          draft={draft}
          onDiscard={async () => {
            await discardDraft();
            setShowResumePrompt(false);
          }}
          onResume={() => {
            setShowResumePrompt(false);
            setActiveTab("train");
          }}
        />
      ) : null}
    </div>
  );
}

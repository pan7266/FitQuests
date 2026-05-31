import { ArrowLeft, ArrowRight, Flame, Swords, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AccentColorControl } from "../../components/controls/AccentColorControl";
import { ThemeSelector } from "../../components/controls/ThemeSelector";
import { NeomorphicButton } from "../../components/neumorphic/NeomorphicButton";
import { listActivities, updateActivity } from "../../db/repositories/activitiesRepo";
import type { AppLanguage, ColorMode, UiStyle, ViewMode } from "../../db/schema";
import { useSettingsStore } from "../../stores/settingsStore";
import { APP_NAME, DEFAULT_ACCENT } from "../../utils/appIdentity";

export interface SetupPayload {
  viewMode: ViewMode;
  appLanguage: AppLanguage;
  uiStyle: UiStyle;
  colorMode: ColorMode;
  accentColor: string;
  displayName: string;
  weightKg?: number;
  heightCm?: number;
  goalWeightKg?: number;
  dailyGoals: Record<string, number>;
}

interface OnboardingScreenProps {
  onComplete: (payload: SetupPayload) => void;
}

const adventureSteps = [
  {
    title: "Train to attack",
    titleEl: "Προπονήσου για να επιτεθείς",
    description: "Every rep becomes damage. Complete sets to strike enemies.",
    descriptionEl: "Κάθε επανάληψη γίνεται ζημιά. Ολοκλήρωσε σετ για να χτυπήσεις εχθρούς.",
    icon: Swords
  },
  {
    title: "Clear realms",
    titleEl: "Καθάρισε βασίλεια",
    description: "Defeat enemies, open chests, unlock bosses, and clear each realm.",
    descriptionEl:
      "Νίκησε εχθρούς, άνοιξε σεντούκια, ξεκλείδωσε αρχηγούς και καθάρισε κάθε βασίλειο.",
    icon: Flame
  },
  {
    title: "Level your hero",
    titleEl: "Ανέβασε επίπεδο τον ήρωα",
    description: "Earn XP, gain skill points, and upgrade your hero.",
    descriptionEl: "Κέρδισε XP, πάρε πόντους δεξιοτήτων και αναβάθμισε τον ήρωά σου.",
    icon: Trophy
  }
];

const goalActivities = [
  { slug: "pull-ups", label: "Pull-ups", labelEl: "Έλξεις", unit: "reps" },
  { slug: "push-ups", label: "Push-ups", labelEl: "Κάμψεις", unit: "reps" },
  { slug: "sit-ups", label: "Sit-ups", labelEl: "Κοιλιακοί", unit: "reps" },
  { slug: "squats", label: "Squats", labelEl: "Καθίσματα", unit: "reps" },
  { slug: "treadmill", label: "Treadmill", labelEl: "Διάδρομος", unit: "km" }
];

const en = {
  skip: "Skip",
  back: "Back",
  next: "Next",
  start: "Start First Fight",
  step: "Step",
  chooseView: "Choose View Mode",
  chooseViewCopy: `Pick how much detail ${APP_NAME} shows day to day.`,
  basic: "Basic",
  basicCopy: "Simpler interface, fewer dashboard tiles, calmer RPG details.",
  advanced: "Advanced",
  advancedCopy: "Full stats, RPG details, progress cards, and combat info.",
  language: "Choose Language",
  theme: "Choose Theme",
  profile: "User Profile",
  optionalProfile: "Optional metric-only profile fields. No health advice is calculated.",
  goals: "Set Optional Activity Goals",
  goalsCopy: "You can skip these now and edit them later in Settings.",
  displayName: "Display name",
  weight: "Weight (kg)",
  height: "Height (cm)",
  goalWeight: "Goal weight (kg)",
  accent: "Accent color",
  hue: "Hue choices",
  reset: "Reset",
  light: "Light",
  dark: "Dark",
  setup: "Setup",
  intro: "First Fight Tutorial"
};

const el: typeof en = {
  skip: "Παράλειψη",
  back: "Πίσω",
  next: "Επόμενο",
  start: "Έναρξη πρώτης μάχης",
  step: "Βήμα",
  chooseView: "Επιλογή προβολής",
  chooseViewCopy: `Διάλεξε πόση λεπτομέρεια θα δείχνει το ${APP_NAME} καθημερινά.`,
  basic: "Βασική προβολή",
  basicCopy: "Πιο απλή διεπαφή, λιγότερες κάρτες και πιο ήρεμες RPG λεπτομέρειες.",
  advanced: "Προχωρημένη προβολή",
  advancedCopy: "Πλήρη στατιστικά, RPG λεπτομέρειες, κάρτες προόδου και στοιχεία μάχης.",
  language: "Επιλογή γλώσσας",
  theme: "Επιλογή θέματος",
  profile: "Προφίλ χρήστη",
  optionalProfile: "Προαιρετικά πεδία σε μετρικές μονάδες. Δεν υπολογίζονται ιατρικές συμβουλές.",
  goals: "Προαιρετικοί στόχοι δραστηριοτήτων",
  goalsCopy: "Μπορείς να τα παραλείψεις τώρα και να τα αλλάξεις αργότερα στις Ρυθμίσεις.",
  displayName: "Εμφανιζόμενο όνομα",
  weight: "Βάρος (kg)",
  height: "Ύψος (cm)",
  goalWeight: "Στόχος βάρους (kg)",
  accent: "Χρώμα έμφασης",
  hue: "Επιλογές απόχρωσης",
  reset: "Επαναφορά",
  light: "Φωτεινό",
  dark: "Σκούρο",
  setup: "Ρύθμιση",
  intro: "Οδηγός πρώτης μάχης"
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const [index, setIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("basic");
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("en");
  const [uiStyle, setUiStyle] = useState<UiStyle>("neomorphism");
  const [colorMode, setColorMode] = useState<ColorMode>("dark");
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [displayName, setDisplayName] = useState("Player");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [goalWeightKg, setGoalWeightKg] = useState("");
  const [dailyGoals, setDailyGoals] = useState<Record<string, string>>({});
  const [activityIdsBySlug, setActivityIdsBySlug] = useState<Record<string, string>>({});
  const labels = appLanguage === "el" ? el : en;
  const totalSteps = 8;
  const isLast = index === totalSteps - 1;
  const adventureIndex = index - 5;
  const adventureStep = adventureSteps[adventureIndex];
  const Icon = adventureStep?.icon ?? Swords;
  const showBottomNext = index === 2 || index === 3 || index === 4 || isLast;
  const goNext = () => setIndex((current) => Math.min(totalSteps - 1, current + 1));
  const goBack = () => setIndex((current) => Math.max(0, current - 1));

  useEffect(() => {
    if (!settings) {
      return;
    }
    setViewMode(settings.viewMode);
    setAppLanguage(settings.appLanguage);
    setUiStyle(settings.uiStyle);
    setColorMode(settings.colorMode);
    setAccentColor(settings.accentColor);
    setDisplayName(settings.displayName?.trim() || "Player");
    setWeightKg(settings.weightKg?.toString() ?? "");
    setHeightCm(settings.heightCm?.toString() ?? "");
    setGoalWeightKg(settings.goalWeightKg?.toString() ?? "");
  }, [settings]);

  useEffect(() => {
    const loadGoalActivities = async () => {
      const activities = await listActivities({ includeArchived: true });
      setActivityIdsBySlug(
        Object.fromEntries(activities.map((activity) => [activity.slug, activity.id]))
      );
      setDailyGoals(
        Object.fromEntries(
          goalActivities.map((goalActivity) => {
            const activity = activities.find((item) => item.slug === goalActivity.slug);
            if (!activity?.dailyGoal) {
              return [goalActivity.slug, ""];
            }
            return [
              goalActivity.slug,
              goalActivity.unit === "km"
                ? (activity.dailyGoal / 1000).toString()
                : activity.dailyGoal.toString()
            ];
          })
        )
      );
    };

    void loadGoalActivities();
  }, []);

  useEffect(() => {
    if (index !== 5 && index !== 6) {
      return undefined;
    }
    const timeout = window.setTimeout(
      () => setIndex((current) => Math.min(totalSteps - 1, current + 1)),
      1600
    );
    return () => window.clearTimeout(timeout);
  }, [index]);

  const persistSettings = (updates: Parameters<typeof updateSettings>[0]) => {
    void updateSettings(updates);
  };

  const updateDailyGoal = (slug: string, rawValue: string, unit: string) => {
    setDailyGoals((current) => ({ ...current, [slug]: rawValue }));
    const activityId = activityIdsBySlug[slug];
    const parsed = Number(rawValue);
    if (!activityId || !Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    const dailyGoal = unit === "km" ? Math.round(parsed * 1000) : Math.floor(parsed);
    void updateActivity(activityId, { dailyGoal });
  };

  const payload = useMemo<SetupPayload>(() => {
    const parsedGoals: Record<string, number> = {};
    for (const item of goalActivities) {
      const raw = Number(dailyGoals[item.slug]);
      if (Number.isFinite(raw) && raw > 0) {
        parsedGoals[item.slug] = item.unit === "km" ? Math.round(raw * 1000) : Math.floor(raw);
      }
    }
    const nextPayload: SetupPayload = {
      viewMode,
      appLanguage,
      uiStyle,
      colorMode,
      accentColor,
      displayName: displayName.trim() || "Player",
      dailyGoals: parsedGoals
    };
    const parsedWeight = parseOptionalNumber(weightKg);
    const parsedHeight = parseOptionalNumber(heightCm);
    const parsedGoalWeight = parseOptionalNumber(goalWeightKg);
    if (parsedWeight !== undefined) {
      nextPayload.weightKg = parsedWeight;
    }
    if (parsedHeight !== undefined) {
      nextPayload.heightCm = parsedHeight;
    }
    if (parsedGoalWeight !== undefined) {
      nextPayload.goalWeightKg = parsedGoalWeight;
    }
    return nextPayload;
  }, [
    accentColor,
    appLanguage,
    colorMode,
    dailyGoals,
    displayName,
    goalWeightKg,
    heightCm,
    uiStyle,
    viewMode,
    weightKg
  ]);

  return (
    <main className="setup-wizard mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-[calc(var(--safe-bottom)+1.25rem)] pt-[calc(var(--safe-top)+1.25rem)]">
      <div className="flex items-center justify-between gap-3">
        {index > 0 ? (
          <button
            className="focus-ring flex min-h-10 items-center gap-2 rounded-2xl px-3 text-sm font-black text-app-soft hover:bg-[var(--hover-soft)]"
            onClick={goBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            {labels.back}
          </button>
        ) : (
          <span />
        )}
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--accent)]">
          {APP_NAME}
        </p>
        <button
          className="focus-ring text-app-muted rounded-xl px-3 text-sm font-bold"
          onClick={() => onComplete(payload)}
          type="button"
        >
          {labels.skip}
        </button>
      </div>
      <section className="flex flex-1 flex-col justify-center py-8">
        <p className="text-app-muted text-center text-sm font-bold">
          {labels.step} {index + 1} / {totalSteps}
        </p>
        {index === 0 ? (
          <SetupCard eyebrow={labels.setup} title={labels.chooseView} copy={labels.chooseViewCopy}>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                copy={labels.basicCopy}
                label={labels.basic}
                onClick={() => {
                  setViewMode("basic");
                  persistSettings({ viewMode: "basic" });
                  goNext();
                }}
                selected={viewMode === "basic"}
              />
              <ChoiceCard
                copy={labels.advancedCopy}
                label={labels.advanced}
                onClick={() => {
                  setViewMode("advanced");
                  persistSettings({ viewMode: "advanced" });
                  goNext();
                }}
                selected={viewMode === "advanced"}
              />
            </div>
          </SetupCard>
        ) : null}
        {index === 1 ? (
          <SetupCard eyebrow={labels.setup} title={labels.language}>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                label="English"
                onClick={() => {
                  setAppLanguage("en");
                  persistSettings({ appLanguage: "en" });
                  goNext();
                }}
                selected={appLanguage === "en"}
              />
              <ChoiceCard
                label="Ελληνικά"
                onClick={() => {
                  setAppLanguage("el");
                  persistSettings({ appLanguage: "el" });
                  goNext();
                }}
                selected={appLanguage === "el"}
              />
            </div>
          </SetupCard>
        ) : null}
        {index === 2 ? (
          <SetupCard eyebrow={labels.setup} title={labels.theme}>
            <ThemeSelector
              colorMode={colorMode}
              onChange={(choice) => {
                setUiStyle(choice.uiStyle);
                setColorMode(choice.colorMode);
                persistSettings({ uiStyle: choice.uiStyle, colorMode: choice.colorMode });
              }}
              uiStyle={uiStyle}
            />
            <div className="app-inset mt-4 grid grid-cols-2 gap-2 rounded-2xl p-2">
              {(["light", "dark"] as const).map((mode) => (
                <button
                  aria-pressed={colorMode === mode}
                  className={`focus-ring min-h-11 rounded-xl px-4 text-sm font-black transition ${
                    colorMode === mode
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
                      : "text-app-soft hover:bg-[var(--hover-soft)]"
                  }`}
                  key={mode}
                  onClick={() => {
                    setColorMode(mode);
                    persistSettings({ colorMode: mode });
                  }}
                  type="button"
                >
                  {mode === "light" ? labels.light : labels.dark}
                </button>
              ))}
            </div>
            <div className="mt-5">
              <AccentColorControl
                hueLabel={labels.hue}
                onChange={(value) => {
                  setAccentColor(value);
                  persistSettings({ accentColor: value });
                }}
                resetLabel={labels.reset}
                title={labels.accent}
                value={accentColor}
              />
            </div>
          </SetupCard>
        ) : null}
        {index === 3 ? (
          <SetupCard eyebrow={labels.setup} title={labels.profile} copy={labels.optionalProfile}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label={labels.displayName}
                onChange={(value) => {
                  setDisplayName(value);
                  persistSettings({ displayName: value.trim() || "Player" });
                }}
                value={displayName}
              />
              <TextField
                inputMode="decimal"
                label={labels.weight}
                onChange={(value) => {
                  setWeightKg(value);
                  const parsed = parseOptionalNumber(value);
                  if (parsed !== undefined) {
                    persistSettings({ weightKg: parsed });
                  }
                }}
                step="0.1"
                type="number"
                value={weightKg}
              />
              <TextField
                inputMode="numeric"
                label={labels.height}
                onChange={(value) => {
                  setHeightCm(value);
                  const parsed = parseOptionalNumber(value);
                  if (parsed !== undefined) {
                    persistSettings({ heightCm: parsed });
                  }
                }}
                step="1"
                type="number"
                value={heightCm}
              />
              <TextField
                inputMode="decimal"
                label={labels.goalWeight}
                onChange={(value) => {
                  setGoalWeightKg(value);
                  const parsed = parseOptionalNumber(value);
                  if (parsed !== undefined) {
                    persistSettings({ goalWeightKg: parsed });
                  }
                }}
                step="0.1"
                type="number"
                value={goalWeightKg}
              />
            </div>
          </SetupCard>
        ) : null}
        {index === 4 ? (
          <SetupCard eyebrow={labels.setup} title={labels.goals} copy={labels.goalsCopy}>
            <div className="grid gap-3 sm:grid-cols-2">
              {goalActivities.map((activity) => (
                <TextField
                  inputMode={activity.unit === "km" ? "decimal" : "numeric"}
                  key={activity.slug}
                  label={`${appLanguage === "el" ? activity.labelEl : activity.label} (${activity.unit})`}
                  onChange={(value) => updateDailyGoal(activity.slug, value, activity.unit)}
                  step={activity.unit === "km" ? "0.1" : "1"}
                  type="number"
                  value={dailyGoals[activity.slug] ?? ""}
                />
              ))}
            </div>
          </SetupCard>
        ) : null}
        {adventureStep ? (
          <section className="text-center">
            <div className="app-card mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] text-[var(--accent)]">
              <Icon aria-hidden="true" size={46} />
            </div>
            <p className="text-app-muted mt-8 text-sm font-bold">{labels.intro}</p>
            <h1 className="text-app mt-3 text-4xl font-black leading-tight">
              {appLanguage === "el" ? adventureStep.titleEl : adventureStep.title}
            </h1>
            <p className="text-app-soft mx-auto mt-4 max-w-96 text-base leading-7">
              {appLanguage === "el" ? adventureStep.descriptionEl : adventureStep.description}
            </p>
            {!isLast ? <BuildingProfileAnimation /> : null}
          </section>
        ) : null}
        <div aria-hidden="true" className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, itemIndex) => ({
            id: `setup-step-dot-${itemIndex}`,
            itemIndex
          })).map((item) => (
            <span
              className={`h-2 rounded-full transition-all ${
                item.itemIndex === index
                  ? "w-9 bg-[var(--accent)] shadow-[var(--accent-glow)]"
                  : "w-2 bg-[var(--toggle-off)]"
              }`}
              key={item.id}
            />
          ))}
        </div>
      </section>
      {showBottomNext ? (
        <NeomorphicButton
          className="flex items-center justify-center gap-2"
          onClick={() => (isLast ? onComplete(payload) : goNext())}
          variant="primary"
        >
          {isLast ? labels.start : labels.next}
          <ArrowRight aria-hidden="true" size={18} />
        </NeomorphicButton>
      ) : null}
    </main>
  );
}

function SetupCard({
  eyebrow,
  title,
  copy,
  children
}: {
  eyebrow: string;
  title: string;
  copy?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="app-card rounded-[2rem] p-5 md:p-6">
      <p className="text-app-muted text-sm font-bold uppercase tracking-[0.16em]">{eyebrow}</p>
      <h1 className="text-app mt-2 text-3xl font-black">{title}</h1>
      {copy ? <p className="text-app-soft mt-2 text-sm leading-6">{copy}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ChoiceCard({
  label,
  copy,
  selected,
  onClick
}: {
  label: string;
  copy?: string | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={`focus-ring app-card min-h-32 rounded-[1.5rem] p-4 text-left transition ${
        selected ? "accent-selected" : ""
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="text-app block text-lg font-black">{label}</span>
      {copy ? <span className="text-app-soft mt-2 block text-sm leading-6">{copy}</span> : null}
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  step
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  inputMode?: "text" | "numeric" | "decimal" | undefined;
  step?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-app-soft mb-2 block text-sm font-bold">{label}</span>
      <input
        className="focus-ring app-inset min-h-12 w-full rounded-2xl px-4 text-base text-app"
        inputMode={inputMode}
        min={0}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function BuildingProfileAnimation() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-inset)] px-4 py-3"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:160ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:320ms]" />
    </div>
  );
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

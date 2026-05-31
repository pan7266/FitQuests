import { Check } from "lucide-react";
import type { ColorMode, UiStyle } from "../../db/schema";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../utils/classNames";
import { translate } from "../../utils/i18n";
import { THEME_STYLE_OPTIONS } from "../../utils/theme";
import { TileButton } from "./Button";

export interface ThemeChoice {
  uiStyle: UiStyle;
  colorMode: ColorMode;
}

interface ThemeSelectorProps {
  uiStyle: UiStyle;
  colorMode: ColorMode;
  onChange: (choice: ThemeChoice) => void;
}

export function ThemeSelector({ uiStyle, colorMode, onChange }: ThemeSelectorProps) {
  const appLanguage = useSettingsStore((state) => state.settings?.appLanguage ?? "en");
  const t = (key: string) => translate(appLanguage, key);
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-app mb-3 text-lg font-black">{t("theme.style")}</legend>
        <div className="theme-choice-grid grid gap-3 md:grid-cols-4">
          {THEME_STYLE_OPTIONS.map((choice) => {
            const selected = choice.uiStyle === uiStyle;
            return (
              <TileButton
                aria-pressed={selected}
                className={cn("min-h-36 rounded-[1.5rem] p-4", selected && "accent-selected")}
                key={choice.uiStyle}
                onClick={() => onChange({ uiStyle: choice.uiStyle, colorMode })}
                selected={selected}
              >
                {selected ? (
                  <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--accent-glow)]">
                    <Check aria-hidden="true" size={16} />
                  </span>
                ) : null}
                <ThemePreviewSwatch uiStyle={choice.uiStyle} />
                <span className="text-app block pr-8 font-black">{t(choice.titleKey)}</span>
                <span className="tile-description text-app-soft mt-1 block text-sm leading-5">
                  {t(choice.descriptionKey)}
                </span>
              </TileButton>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function ThemePreviewSwatch({ uiStyle }: { uiStyle: UiStyle }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "theme-preview-swatch mb-4 grid h-14 w-24 grid-cols-[1fr_2fr] gap-2 rounded-2xl border p-2",
        uiStyle === "material" || uiStyle === "ios"
          ? "border-slate-300 bg-white"
          : "border-[var(--border-soft)] bg-[var(--surface-inset)]",
        uiStyle === "glassmorphism" && "backdrop-blur"
      )}
    >
      <span className="rounded-xl bg-[var(--accent)]" />
      <span className="rounded-xl bg-[var(--surface-raised)]" />
    </span>
  );
}

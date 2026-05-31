import type { AppLanguage, ColorMode, UiDensity, UiStyle } from "../db/schema";

export interface ThemeStyleOption {
  uiStyle: UiStyle;
  titleKey: string;
  descriptionKey: string;
}

export const THEME_STYLE_OPTIONS: ThemeStyleOption[] = [
  {
    uiStyle: "neomorphism",
    titleKey: "theme.neomorphism",
    descriptionKey: "theme.neomorphismDescription"
  },
  {
    uiStyle: "glassmorphism",
    titleKey: "theme.glassmorphism",
    descriptionKey: "theme.glassmorphismDescription"
  },
  {
    uiStyle: "material",
    titleKey: "theme.cleanMaterial",
    descriptionKey: "theme.cleanMaterialDescription"
  },
  {
    uiStyle: "ios",
    titleKey: "theme.nativeIos26",
    descriptionKey: "theme.nativeIos26Description"
  }
];

export const getThemeClassName = (
  uiStyle: UiStyle = "neomorphism",
  colorMode: ColorMode = "dark",
  uiDensity: UiDensity = "cozy",
  appLanguage: AppLanguage = "en"
) => `theme-root theme-${uiStyle} color-${colorMode} density-${uiDensity} lang-${appLanguage}`;

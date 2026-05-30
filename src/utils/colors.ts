import type { CSSProperties } from "react";
import { DEFAULT_ACCENT } from "./appIdentity";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const hexToHue = (hex: string) => {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  if (!Number.isFinite(value)) {
    return 221;
  }
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) {
    return 221;
  }
  const hue =
    max === red
      ? 60 * (((green - blue) / delta) % 6)
      : max === green
        ? 60 * ((blue - red) / delta + 2)
        : 60 * ((red - green) / delta + 4);
  return Math.round((hue + 360) % 360);
};

export const hexToHsv = (hex: string) => {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  if (!Number.isFinite(value)) {
    return { hue: 221, saturation: 78, value: 92 };
  }
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const hue = hexToHue(hex);
  const saturation = max === 0 ? 0 : delta / max;

  return {
    hue,
    saturation: Math.round(saturation * 100),
    value: Math.round(max * 100)
  };
};

export const hsvToHex = (hue: number, saturation: number, value: number) => {
  const safeHue = clamp(hue, 0, 360);
  const safeSaturation = clamp(saturation, 0, 100) / 100;
  const safeValue = clamp(value, 0, 100) / 100;
  const chroma = safeValue * safeSaturation;
  const x = chroma * (1 - Math.abs(((safeHue / 60) % 2) - 1));
  const match = safeValue - chroma;
  const [red, green, blue] =
    safeHue < 60
      ? [chroma, x, 0]
      : safeHue < 120
        ? [x, chroma, 0]
        : safeHue < 180
          ? [0, chroma, x]
          : safeHue < 240
            ? [0, x, chroma]
            : safeHue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const toHex = (channel: number) =>
    Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

export const hueToAccent = (hue: number) => hsvToHex(hue, 84, 88);

export const getAccentStyle = (accentColor = DEFAULT_ACCENT) =>
  ({
    "--accent": accentColor,
    "--accent-blue": accentColor,
    "--accent-soft": accentColor,
    "--accent-glow": `0 0 28px color-mix(in srgb, ${accentColor} 34%, transparent)`,
    "--accent-contrast": "#FFFFFF"
  }) as CSSProperties;

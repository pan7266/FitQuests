import { RotateCcw } from "lucide-react";
import type { KeyboardEvent, PointerEvent } from "react";
import { DEFAULT_ACCENT } from "../../utils/appIdentity";
import { hexToHsv, hsvToHex } from "../../utils/colors";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface AccentColorControlProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  hueLabel: string;
  resetLabel: string;
}

export function AccentColorControl({
  value,
  onChange,
  title,
  hueLabel,
  resetLabel
}: AccentColorControlProps) {
  const hsv = hexToHsv(value);
  const pureColor = hsvToHex(hsv.hue, 100, 100);

  const chooseFromMap = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    onChange(hsvToHex(hsv.hue, x * 100, (1 - y) * 100));
  };
  const adjustFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 10 : 4;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const nextSaturation =
      event.key === "ArrowLeft"
        ? hsv.saturation - step
        : event.key === "ArrowRight"
          ? hsv.saturation + step
          : hsv.saturation;
    const nextValue =
      event.key === "ArrowDown"
        ? hsv.value - step
        : event.key === "ArrowUp"
          ? hsv.value + step
          : hsv.value;
    onChange(hsvToHex(hsv.hue, clamp(nextSaturation, 0, 100), clamp(nextValue, 0, 100)));
  };

  return (
    <fieldset>
      <legend className="text-app mb-3 text-lg font-black">{title}</legend>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_3rem]">
          <button
            aria-label="Choose accent saturation and brightness"
            className="focus-ring relative h-44 w-full overflow-hidden rounded-[1.5rem] border border-[var(--border-soft)] shadow-[var(--shadow-inset)]"
            onPointerDown={chooseFromMap}
            onPointerMove={(event) => {
              if (event.buttons === 1) {
                chooseFromMap(event);
              }
            }}
            onKeyDown={adjustFromKeyboard}
            style={{
              background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${pureColor})`
            }}
            type="button"
          >
            <span
              aria-hidden="true"
              className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{
                backgroundColor: value,
                left: `${hsv.saturation}%`,
                top: `${100 - hsv.value}%`
              }}
            />
          </button>
          <label className="app-inset flex h-44 items-center justify-center rounded-[1.25rem] px-2">
            <span className="sr-only">Brightness</span>
            <input
              aria-label="Brightness"
              className="accent-range accent-range-vertical"
              max={100}
              min={0}
              onChange={(event) =>
                onChange(hsvToHex(hsv.hue, hsv.saturation, Number(event.target.value)))
              }
              style={{
                background: `linear-gradient(to top, #000, ${pureColor}, #fff)`
              }}
              type="range"
              value={hsv.value}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-app-soft mb-2 block text-sm font-bold">{hueLabel}</span>
          <input
            aria-label={hueLabel}
            className="accent-range w-full"
            max={360}
            min={0}
            onChange={(event) =>
              onChange(hsvToHex(Number(event.target.value), hsv.saturation, hsv.value))
            }
            style={{
              background:
                "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #2563eb, #7c3aed, #db2777, #ef4444)"
            }}
            type="range"
            value={hsv.hue}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div
            aria-label="Accent preview"
            className="h-11 w-16 rounded-2xl border border-[var(--border-soft)] shadow-[var(--accent-glow)]"
            role="img"
            style={{ backgroundColor: value }}
          />
          <p className="text-app font-black">{value.toUpperCase()}</p>
          <button
            className="focus-ring ml-auto flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 text-sm font-black text-[var(--accent-contrast)] shadow-[var(--accent-glow)]"
            onClick={() => onChange(DEFAULT_ACCENT)}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
            {resetLabel}
          </button>
        </div>
      </div>
    </fieldset>
  );
}

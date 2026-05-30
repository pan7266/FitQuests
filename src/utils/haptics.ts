export const triggerHaptic = (enabled: boolean, pattern: number | number[] = 16) => {
  if (!enabled) {
    return;
  }

  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Haptics are optional and must fail silently.
  }
};

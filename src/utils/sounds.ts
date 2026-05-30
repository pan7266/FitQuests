type SoundEvent = "rep" | "setComplete" | "restComplete";

let audioContext: AudioContext | undefined;

const getAudioContext = () => {
  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextConstructor) {
    return undefined;
  }

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  return audioContext;
};

export const unlockAudio = async () => {
  try {
    const context = getAudioContext();
    if (context?.state === "suspended") {
      await context.resume();
    }
  } catch {
    // Audio unlock can be blocked by the browser and should not interrupt tracking.
  }
};

export const playBeep = (enabled: boolean, event: SoundEvent) => {
  if (!enabled) {
    return;
  }

  try {
    const context = getAudioContext();
    if (!context || context.state === "suspended") {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const frequency = event === "rep" ? 420 : event === "setComplete" ? 620 : 760;
    const duration = event === "restComplete" ? 0.18 : 0.08;

    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  } catch {
    // Short generated sounds are optional and must fail silently.
  }
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

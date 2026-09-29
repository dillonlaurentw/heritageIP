/**
 * Hold to talk: the phone's own speech recognition turns what you say into
 * text. On-device when the phone supports it, so the audio never leaves it.
 * If the native module isn't there (e.g. Expo Go), `available` is false and
 * the journal falls back to typing (and the keyboard's own mic).
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Mod = typeof import("expo-speech-recognition").ExpoSpeechRecognitionModule;
let mod: Mod | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require("expo-speech-recognition").ExpoSpeechRecognitionModule as Mod;
} catch {
  mod = null;
}

export function useVoice(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState("");
  const heard = useRef("");
  const available = !!mod && safe(() => mod!.isRecognitionAvailable(), false);

  useEffect(() => {
    if (!mod) return;
    const subs = [
      mod.addListener("result", (e) => {
        const text = e.results[0]?.transcript ?? "";
        heard.current = text;
        setPartial(text);
      }),
      mod.addListener("end", () => {
        setListening(false);
        const text = heard.current.trim();
        heard.current = "";
        setPartial("");
        if (text) onFinal(text);
      }),
      mod.addListener("error", (e) => {
        setListening(false);
        if (e.error !== "no-speech" && e.error !== "aborted") setError("Couldn't hear that. Try again, or type.");
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [onFinal]);

  const start = useCallback(async () => {
    if (!mod) return;
    setError("");
    const perm = await mod.requestPermissionsAsync();
    if (!perm.granted) return setError("SELF needs the microphone to hear you. You can turn it on in Settings.");
    heard.current = "";
    setListening(true);
    mod.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
      requiresOnDeviceRecognition: safe(() => mod!.supportsOnDeviceRecognition(), false),
    });
  }, []);

  const stop = useCallback(() => mod?.stop(), []);
  return { available, listening, partial, error, start, stop };
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StepTimer } from "@/lib/types/recipe-types";

function chime() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1.2);
  } catch {
    return;
  }
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

export function useStepTimers(onFinish: (timer: StepTimer) => void) {
  const [timers, setTimers] = useState<StepTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (timers.length === 0) return;
    const interval = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      setTimers((running) => {
        const done = running.filter((timer) => timer.endsAt <= current);
        if (done.length === 0) return running;
        for (const timer of done) {
          chime();
          navigator.vibrate?.([200, 100, 200]);
          finishRef.current(timer);
        }
        return running.filter((timer) => timer.endsAt > current);
      });
    }, 500);
    return () => window.clearInterval(interval);
  }, [timers.length]);

  const start = useCallback(
    (stepId: string, label: string, minutes: number) => {
      const startedAt = Date.now();
      setNow(startedAt);
      setTimers((running) => [
        ...running.filter((timer) => timer.stepId !== stepId),
        { stepId, label, endsAt: startedAt + minutes * 60_000 },
      ]);
    },
    [],
  );

  const cancel = useCallback((stepId: string) => {
    setTimers((running) => running.filter((timer) => timer.stepId !== stepId));
  }, []);

  return { timers, now, start, cancel };
}

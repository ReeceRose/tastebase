"use client";

import { useEffect, useState } from "react";

const ACTIVATION_OFFSET = 160;

export function useActiveSection<T extends string>(ids: T[]): T | null {
  const [active, setActive] = useState<T | null>(ids[0] ?? null);
  const key = ids.join(",");

  useEffect(() => {
    const sectionIds = key.split(",") as T[];
    let frame = 0;

    const update = () => {
      frame = 0;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(sectionIds[sectionIds.length - 1] ?? null);
        return;
      }
      let current = sectionIds[0] ?? null;
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (
          element &&
          element.getBoundingClientRect().top <= ACTIVATION_OFFSET
        ) {
          current = id;
        }
      }
      setActive(current);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);

  return active;
}

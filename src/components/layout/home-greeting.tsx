"use client";

import { useEffect, useState } from "react";

interface HomeGreetingProps {
  name: string;
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Late one";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function HomeGreeting({ name }: HomeGreetingProps) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
      {greeting}, {name}
    </h1>
  );
}

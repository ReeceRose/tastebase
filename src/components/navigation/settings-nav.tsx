"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { SETTINGS_SECTIONS } from "@/components/navigation/settings-items";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SettingsSection } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SettingsNavProps {
  active: SettingsSection;
}

export function SettingsNav({ active }: SettingsNavProps) {
  const router = useRouter();
  const selectId = useId();

  return (
    <>
      <div className="lg:hidden">
        <label htmlFor={selectId} className="sr-only">
          Settings section
        </label>
        <Select
          value={active}
          onValueChange={(value) => router.push(`/settings?section=${value}`)}
        >
          <SelectTrigger id={selectId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SETTINGS_SECTIONS.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <nav
        aria-label="Settings"
        className="sticky top-6 hidden self-start lg:block"
      >
        <ul className="space-y-1">
          {SETTINGS_SECTIONS.map((section) => {
            const current = section.id === active;
            return (
              <li key={section.id}>
                <Link
                  href={`/settings?section=${section.id}`}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring",
                    current
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-foreground/5",
                  )}
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

"use client";

import { useActiveSection } from "@/hooks/use-active-section";
import { EditorSection } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EditorSectionNavProps {
  sectionsWithErrors: Set<EditorSection>;
}

const SECTIONS = [
  { id: EditorSection.BASICS, label: "Basics" },
  { id: EditorSection.INGREDIENTS, label: "Ingredients" },
  { id: EditorSection.METHOD, label: "Method" },
  { id: EditorSection.PHOTOS, label: "Photos" },
  { id: EditorSection.DETAILS, label: "Details" },
  { id: EditorSection.SHARING, label: "Who can see it" },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

export function EditorSectionNav({
  sectionsWithErrors,
}: EditorSectionNavProps) {
  const activeSection = useActiveSection(SECTION_IDS);

  return (
    <nav
      aria-label="Recipe sections"
      className="sticky top-24 hidden self-start lg:block"
    >
      <ul className="space-y-1">
        {SECTIONS.map((section) => {
          const hasError = sectionsWithErrors.has(section.id);
          const current = section.id === activeSection;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring",
                  current
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-foreground/5",
                  hasError && !current && "text-destructive",
                )}
              >
                {section.label}
                {hasError && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-caption text-destructive-foreground">
                    Fix
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

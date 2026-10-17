"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Theme } from "@/lib/types";

const OPTIONS = [
  { value: Theme.LIGHT, label: "Light", icon: Sun },
  { value: Theme.DARK, label: "Dark", icon: Moon },
  { value: Theme.SYSTEM, label: "Match my device", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Appearance"
        className="relative grid size-11 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <Sun className="size-5 scale-100 transition-transform dark:scale-0" />
        <Moon className="absolute size-5 scale-0 transition-transform dark:scale-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

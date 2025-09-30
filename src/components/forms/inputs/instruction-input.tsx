"use client";

import { Clock, Thermometer, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface InstructionData {
  instruction: string;
  timeMinutes?: number;
  temperature?: string;
  notes?: string;
  groupName?: string;
}

interface InstructionInputProps {
  value: InstructionData;
  onChange: (value: InstructionData) => void;
  onRemove?: () => void;
  stepNumber: number;
  showRemove?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

// Common cooking temperatures
const COMMON_TEMPERATURES = [
  "350°F",
  "375°F",
  "400°F",
  "425°F",
  "450°F",
  "500°F",
  "175°C",
  "190°C",
  "200°C",
  "220°C",
  "230°C",
  "260°C",
  "low heat",
  "medium-low heat",
  "medium heat",
  "medium-high heat",
  "high heat",
  "simmering",
  "boiling",
  "room temperature",
  "cold",
];

// Common cooking actions that might have time/temp suggestions
const COOKING_ACTIONS_WITH_TIMES = {
  bake: { defaultTime: 25, commonTemps: ["350°F", "375°F", "400°F"] },
  roast: { defaultTime: 45, commonTemps: ["400°F", "425°F", "450°F"] },
  boil: { defaultTime: 10, commonTemps: ["boiling", "high heat"] },
  simmer: { defaultTime: 15, commonTemps: ["simmering", "medium-low heat"] },
  fry: { defaultTime: 5, commonTemps: ["medium-high heat", "350°F"] },
  sauté: { defaultTime: 5, commonTemps: ["medium heat", "medium-high heat"] },
  grill: { defaultTime: 8, commonTemps: ["medium-high heat", "high heat"] },
  broil: { defaultTime: 3, commonTemps: ["broil", "high heat"] },
  steam: { defaultTime: 10, commonTemps: ["steaming", "medium heat"] },
  braise: { defaultTime: 120, commonTemps: ["325°F", "350°F"] },
};

export function InstructionInput({
  value,
  onChange,
  onRemove,
  stepNumber,
  showRemove = true,
  autoFocus = false,
  placeholder = "Describe the step in detail...",
  className,
}: InstructionInputProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tempSuggestions, setTempSuggestions] = useState<string[]>([]);

  const analyzeInstructionForSuggestions = (instruction: string) => {
    const lower = instruction.toLowerCase();

    for (const [action, data] of Object.entries(COOKING_ACTIONS_WITH_TIMES)) {
      if (lower.includes(action)) {
        // Suggest default time if not set
        if (!value.timeMinutes) {
          onChange({ ...value, timeMinutes: data.defaultTime });
        }
        // Show temperature suggestions
        setTempSuggestions(data.commonTemps);
        return;
      }
    }

    setTempSuggestions([]);
  };

  const handleInstructionChange = (instruction: string) => {
    onChange({ ...value, instruction });

    // Auto-suggest based on content
    if (instruction.length > 10) {
      analyzeInstructionForSuggestions(instruction);
    }
  };

  const handleTemperatureChange = (temperature: string) => {
    onChange({ ...value, temperature });

    // Generate temperature suggestions
    if (temperature.length >= 1) {
      const suggestions = COMMON_TEMPERATURES.filter(
        (temp) =>
          temp.toLowerCase().includes(temperature.toLowerCase()) &&
          temp.toLowerCase() !== temperature.toLowerCase(),
      ).slice(0, 5);
      setTempSuggestions(suggestions);
    }
  };

  const formatTimeDisplay = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
  };

  const parseTimeInput = (input: string): number | undefined => {
    if (!input.trim()) return undefined;

    // Parse various time formats
    const patterns = [
      /^(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m(?:in(?:utes?)?)?$/i, // 1h 30m, 1 hour 30 minutes
      /^(\d+)\s*h(?:ours?)?$/i, // 1h, 1 hour
      /^(\d+)\s*m(?:in(?:utes?)?)?$/i, // 30m, 30 minutes
      /^(\d+)$/i, // Just number (assume minutes)
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        if (pattern.source.includes("h")) {
          const hours = parseInt(match[1], 10);
          const minutes = match[2] ? parseInt(match[2], 10) : 0;
          return hours * 60 + minutes;
        } else {
          return parseInt(match[1], 10);
        }
      }
    }

    return undefined;
  };

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="min-w-fit">
          Step {stepNumber}
        </Badge>

        {/* Quick time/temp indicators */}
        {value.timeMinutes && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimeDisplay(value.timeMinutes)}
          </Badge>
        )}

        {value.temperature && (
          <Badge variant="outline" className="text-xs">
            <Thermometer className="h-3 w-3 mr-1" />
            {value.temperature}
          </Badge>
        )}

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs"
        >
          {showAdvanced ? "Less" : "More"}
        </Button>

        {showRemove && onRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Main instruction text */}
      <Textarea
        placeholder={placeholder}
        value={value.instruction}
        onChange={(e) => handleInstructionChange(e.target.value)}
        autoFocus={autoFocus}
        rows={2}
        className="resize-none"
      />

      {/* Inline time and temperature inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Time
          </Label>
          <Input
            placeholder="15 min, 1h 30m"
            value={
              value.timeMinutes ? formatTimeDisplay(value.timeMinutes) : ""
            }
            onChange={(e) => {
              const parsed = parseTimeInput(e.target.value);
              onChange({ ...value, timeMinutes: parsed });
            }}
            className="text-sm"
          />
        </div>

        <div className="relative">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            Temperature
          </Label>
          <Input
            placeholder="350°F, medium heat"
            value={value.temperature || ""}
            onChange={(e) => handleTemperatureChange(e.target.value)}
            className="text-sm"
          />
          {tempSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg mt-1">
              {tempSuggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={`temp-${suggestion}`}
                  type="button"
                  onClick={() => {
                    onChange({ ...value, temperature: suggestion });
                    setTempSuggestions([]);
                  }}
                  className="block w-full text-left px-2 py-1 text-xs hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l-2 border-muted">
          <div>
            <Label className="text-xs text-muted-foreground">
              Additional Notes
            </Label>
            <Input
              placeholder="Tips, variations, etc."
              value={value.notes || ""}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Group</Label>
            <Input
              placeholder="Prep, Cooking, Assembly"
              value={value.groupName || ""}
              onChange={(e) =>
                onChange({ ...value, groupName: e.target.value })
              }
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

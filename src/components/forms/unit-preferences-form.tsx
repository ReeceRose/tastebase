/**
 * Form component for updating user unit preferences
 */

"use client";

import { useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ComponentSize,
  MeasurementUnit,
  MessageType,
  TemperatureUnit,
  type UserPreferencesSubset,
} from "@/lib/types";
import {
  getPreferenceExamples,
  getUserPreferencesWithFallback,
  type UserPreferences,
  validateUserPreferences,
} from "@/lib/utils/user-preferences";

interface UnitPreferencesFormProps {
  user?: UserPreferencesSubset | null;
  onSave: (
    preferences: UserPreferences,
  ) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

export function UnitPreferencesForm({
  user,
  onSave,
  className,
}: UnitPreferencesFormProps) {
  const tempId = useId();
  const weightId = useId();
  const volumeId = useId();

  const currentPreferences = getUserPreferencesWithFallback(user);
  const [preferences, setPreferences] =
    useState<UserPreferences>(currentPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: MessageType;
    text: string;
  } | null>(null);

  const examples = getPreferenceExamples(preferences);
  const hasChanges =
    JSON.stringify(preferences) !== JSON.stringify(currentPreferences);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    const validation = validateUserPreferences(preferences);
    if (!validation.isValid) {
      setMessage({
        type: MessageType.ERROR,
        text: validation.errors.join(", "),
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await onSave(validation.sanitized);
      if (result.success) {
        setMessage({
          type: MessageType.SUCCESS,
          text: "Preferences updated successfully!",
        });
      } else {
        setMessage({
          type: MessageType.ERROR,
          text: result.error || "Failed to update preferences",
        });
      }
    } catch {
      setMessage({
        type: MessageType.ERROR,
        text: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreferences(currentPreferences);
    setMessage(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Unit Preferences</CardTitle>
        <CardDescription>
          Choose your preferred units for displaying recipes. All recipes will
          be converted to your preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && (
          <Alert
            variant={
              message.type === MessageType.ERROR ? "destructive" : "default"
            }
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Temperature Units */}
        <div className="space-y-1.5">
          <Label className="text-base font-medium">Temperature</Label>
          <RadioGroup
            value={preferences.preferredTemperatureUnit}
            onValueChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                preferredTemperatureUnit: value as TemperatureUnit,
              }))
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={TemperatureUnit.FAHRENHEIT}
                id={`${tempId}-fahrenheit`}
              />
              <Label htmlFor={`${tempId}-fahrenheit`} className="font-normal">
                Fahrenheit (°F)
                <span className="text-muted-foreground ml-2">
                  e.g., {examples.temperature.imperial}
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={TemperatureUnit.CELSIUS}
                id={`${tempId}-celsius`}
              />
              <Label htmlFor={`${tempId}-celsius`} className="font-normal">
                Celsius (°C)
                <span className="text-muted-foreground ml-2">
                  e.g., {examples.temperature.metric}
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Weight Units */}
        <div className="space-y-1.5">
          <Label className="text-base font-medium">Weight & Mass</Label>
          <RadioGroup
            value={preferences.preferredWeightUnit}
            onValueChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                preferredWeightUnit: value as MeasurementUnit,
              }))
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={MeasurementUnit.IMPERIAL}
                id={`${weightId}-imperial`}
              />
              <Label htmlFor={`${weightId}-imperial`} className="font-normal">
                Imperial (oz, lbs)
                <span className="text-muted-foreground ml-2">
                  e.g., {examples.weight.imperial}
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={MeasurementUnit.METRIC}
                id={`${weightId}-metric`}
              />
              <Label htmlFor={`${weightId}-metric`} className="font-normal">
                Metric (g, kg)
                <span className="text-muted-foreground ml-2">
                  e.g., {examples.weight.metric}
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Volume Units */}
        <div className="space-y-1.5">
          <Label className="text-base font-medium">Volume & Liquid</Label>
          <RadioGroup
            value={preferences.preferredVolumeUnit}
            onValueChange={(value) =>
              setPreferences((prev) => ({
                ...prev,
                preferredVolumeUnit: value as MeasurementUnit,
              }))
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={MeasurementUnit.IMPERIAL}
                id={`${volumeId}-imperial`}
              />
              <Label htmlFor={`${volumeId}-imperial`} className="font-normal">
                Imperial (tsp, tbsp, cups)
                <span className="text-muted-foreground ml-2">
                  e.g., {examples.volume.imperial}
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={MeasurementUnit.METRIC}
                id={`${volumeId}-metric`}
              />
              <Label htmlFor={`${volumeId}-metric`} className="font-normal">
                Metric (ml, L)
                <span className="text-muted-foreground ml-2">
                  e.g., {examples.volume.metric}
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Preview */}
        <div className="bg-muted/30 rounded-lg px-3 py-2.5">
          <h4 className="font-medium mb-1.5">Preview</h4>
          <p className="text-sm text-muted-foreground mb-1.5">
            With your current settings, recipe measurements will display as:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <span>🌡️ {examples.temperature.user}</span>
            <span>⚖️ {examples.weight.user}</span>
            <span>🥤 {examples.volume.user}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? (
              <>
                <Loading size={ComponentSize.SM} className="mr-2" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>

          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

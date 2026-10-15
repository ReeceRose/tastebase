"use client";

import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AIProviderForm } from "@/components/forms/ai-provider-form";
import { AISettingsSkeleton } from "@/components/skeletons/ai-settings-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDefaultModel, getModelDisplayName } from "@/lib/ai/models";
import {
  deleteAIProviderSettingsAction,
  getAISettingsAction,
  setActiveAIProviderAction,
} from "@/lib/server-actions/ai-config-actions";
import {
  type AIProviderSettings,
  ImageProcessingMethod,
  PROVIDER_DISPLAY_NAMES,
} from "@/lib/types/ai-types";

function describeModel(settings: AIProviderSettings): string {
  if (settings.modelName) {
    return getModelDisplayName(settings.provider, settings.modelName);
  }
  const fallback = getDefaultModel(settings.provider);
  return fallback
    ? `Recommended (${getModelDisplayName(settings.provider, fallback)})`
    : "Recommended";
}

export function AISettingsForm() {
  const [configurations, setConfigurations] = useState<
    AIProviderSettings[] | null
  >(null);
  const [editing, setEditing] = useState<AIProviderSettings | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadSettings = useCallback(async () => {
    const result = await getAISettingsAction();
    if (result.success) {
      setConfigurations(result.data);
    } else {
      toast.error(result.error);
      setConfigurations([]);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const closeForm = () => {
    setEditing(null);
    setIsAdding(false);
  };

  const handleSaved = async () => {
    closeForm();
    await loadSettings();
  };

  const handleSetActive = async (configId: string | null) => {
    const result = await setActiveAIProviderAction(configId);
    if (result.success) {
      toast.success(configId ? "Provider activated" : "AI turned off");
      await loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (configId: string) => {
    const result = await deleteAIProviderSettingsAction(configId);
    if (result.success) {
      toast.success("Provider removed");
      await loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  if (configurations === null) {
    return <AISettingsSkeleton />;
  }

  const formOpen = isAdding || editing !== null;
  const hasActive = configurations.some((config) => config.isActive);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        AI is optional. Tastebase imports most recipe links and tidy text on its
        own. An AI provider helps with messy text and photos of recipes.
      </p>

      {configurations.length > 0 && (
        <div className="space-y-3">
          {configurations.map((config) => (
            <div
              key={config.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {PROVIDER_DISPLAY_NAMES[config.provider]}
                  </span>
                  {config.isActive && <Badge>Active</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {describeModel(config)}
                  {config.maskedApiKey ? ` · ${config.maskedApiKey}` : ""}
                  {config.imageProcessingMethod === ImageProcessingMethod.OCR
                    ? " · Photos read on this server"
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {!config.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetActive(config.id)}
                    disabled={formOpen}
                  >
                    Use
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Edit provider"
                  onClick={() => {
                    setIsAdding(false);
                    setEditing(config);
                  }}
                  disabled={formOpen}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Remove provider"
                  onClick={() => handleDelete(config.id)}
                  disabled={formOpen}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <AIProviderForm
          key={editing?.id ?? "new"}
          existing={editing}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add provider
          </Button>
          {hasActive && (
            <Button variant="outline" onClick={() => handleSetActive(null)}>
              <Power className="mr-2 h-4 w-4" />
              Turn off AI
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

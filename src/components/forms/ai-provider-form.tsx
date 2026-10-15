"use client";

import { CheckCircle, Loader2, PlugZap, XCircle } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getDefaultModel, getModelsForProvider } from "@/lib/ai/models";
import {
  saveAIProviderSettingsAction,
  testAIProviderAction,
} from "@/lib/server-actions/ai-config-actions";
import {
  AIProvider,
  type AIProviderSettings,
  type AIProviderSettingsInput,
  type AIProviderValue,
  DEFAULT_OLLAMA_HOST,
  ImageProcessingMethod,
  PROVIDER_DISPLAY_NAMES,
  type ProviderConnectionResult,
} from "@/lib/types/ai-types";

const DEFAULT_MODEL_VALUE = "default";
const CUSTOM_MODEL_VALUE = "custom";

const SELECTABLE_PROVIDERS: AIProviderValue[] = [
  AIProvider.ANTHROPIC,
  AIProvider.OPENAI,
  AIProvider.GOOGLE,
  AIProvider.OLLAMA,
];

interface AIProviderFormProps {
  existing: AIProviderSettings | null;
  onSaved: () => void;
  onCancel: () => void;
}

function initialModelChoice(settings: AIProviderSettings | null): string {
  if (!settings?.modelName) {
    return DEFAULT_MODEL_VALUE;
  }
  const known = getModelsForProvider(settings.provider).some(
    (model) => model.id === settings.modelName,
  );
  return known ? settings.modelName : CUSTOM_MODEL_VALUE;
}

export function AIProviderForm({
  existing,
  onSaved,
  onCancel,
}: AIProviderFormProps) {
  const apiKeyId = useId();
  const customModelId = useId();
  const ollamaHostId = useId();
  const activeId = useId();
  const photoAutoId = useId();
  const photoOcrId = useId();

  const [provider, setProvider] = useState<AIProviderValue>(
    existing?.provider ?? AIProvider.ANTHROPIC,
  );
  const [apiKey, setApiKey] = useState("");
  const [modelChoice, setModelChoice] = useState(initialModelChoice(existing));
  const [customModel, setCustomModel] = useState(
    initialModelChoice(existing) === CUSTOM_MODEL_VALUE
      ? (existing?.modelName ?? "")
      : "",
  );
  const [ollamaHost, setOllamaHost] = useState(
    existing?.ollamaHost ?? DEFAULT_OLLAMA_HOST,
  );
  const [imageMethod, setImageMethod] = useState(
    existing?.imageProcessingMethod === ImageProcessingMethod.OCR
      ? ImageProcessingMethod.OCR
      : ImageProcessingMethod.AUTO,
  );
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [testResult, setTestResult] = useState<ProviderConnectionResult | null>(
    null,
  );
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isOllama = provider === AIProvider.OLLAMA;
  const keepsExistingKey =
    existing !== null && existing.provider === provider && existing.hasApiKey;
  const defaultModel = getDefaultModel(provider);

  const buildInput = (): AIProviderSettingsInput => ({
    provider,
    apiKey: apiKey.trim() || null,
    modelName:
      modelChoice === DEFAULT_MODEL_VALUE
        ? null
        : modelChoice === CUSTOM_MODEL_VALUE
          ? customModel.trim() || null
          : modelChoice,
    ollamaHost: isOllama ? ollamaHost.trim() || null : null,
    imageProcessingMethod: imageMethod,
    isActive,
  });

  const handleProviderChange = (value: string) => {
    const next = SELECTABLE_PROVIDERS.find((item) => item === value);
    if (next) {
      setProvider(next);
      setModelChoice(DEFAULT_MODEL_VALUE);
      setCustomModel("");
      setTestResult(null);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testAIProviderAction(
      keepsExistingKey ? existing.id : null,
      buildInput(),
    );
    setIsTesting(false);
    if (result.success) {
      setTestResult(result.data);
    } else {
      toast.error(result.error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveAIProviderSettingsAction(
      existing?.id ?? null,
      buildInput(),
    );
    setIsSaving(false);
    if (result.success) {
      toast.success("AI provider saved");
      onSaved();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>Provider</Label>
        <Select value={provider} onValueChange={handleProviderChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SELECTABLE_PROVIDERS.map((item) => (
              <SelectItem key={item} value={item}>
                {PROVIDER_DISPLAY_NAMES[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isOllama ? (
        <div className="space-y-2">
          <Label htmlFor={ollamaHostId}>Ollama host</Label>
          <Input
            id={ollamaHostId}
            value={ollamaHost}
            onChange={(event) => setOllamaHost(event.target.value)}
            placeholder={DEFAULT_OLLAMA_HOST}
          />
          <p className="text-sm text-muted-foreground">
            Runs models on your own hardware. Nothing leaves your network.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={apiKeyId}>API key</Label>
          <Input
            id={apiKeyId}
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={
              keepsExistingKey
                ? `Leave blank to keep ${existing.maskedApiKey ?? "the saved key"}`
                : "Paste your API key"
            }
          />
          <p className="text-sm text-muted-foreground">
            Stored encrypted on this server.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Model</Label>
        <Select value={modelChoice} onValueChange={setModelChoice}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_MODEL_VALUE}>
              Recommended{defaultModel ? ` (${defaultModel})` : ""}
            </SelectItem>
            {getModelsForProvider(provider).map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.displayName}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_MODEL_VALUE}>Other model…</SelectItem>
          </SelectContent>
        </Select>
        {modelChoice === CUSTOM_MODEL_VALUE && (
          <Input
            id={customModelId}
            aria-label="Model ID"
            value={customModel}
            onChange={(event) => setCustomModel(event.target.value)}
            placeholder="Model ID, e.g. llama3.3"
          />
        )}
        <p className="text-sm text-muted-foreground">
          Recommended always uses Tastebase's current pick for this provider.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Photo imports</Label>
        <RadioGroup
          value={imageMethod}
          onValueChange={(value) =>
            setImageMethod(
              value === ImageProcessingMethod.OCR
                ? ImageProcessingMethod.OCR
                : ImageProcessingMethod.AUTO,
            )
          }
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem
              value={ImageProcessingMethod.AUTO}
              id={photoAutoId}
            />
            <Label htmlFor={photoAutoId} className="font-normal leading-snug">
              Send photos to the AI when the model can read images (most
              accurate)
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <RadioGroupItem value={ImageProcessingMethod.OCR} id={photoOcrId} />
            <Label htmlFor={photoOcrId} className="font-normal leading-snug">
              Read photos on this server only (OCR, never sent to the AI)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id={activeId}
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor={activeId} className="font-normal">
          Use this provider for imports
        </Label>
      </div>

      {testResult && (
        <Alert variant={testResult.valid ? "default" : "destructive"}>
          {testResult.valid ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {testResult.valid
              ? `Connected. ${testResult.models.length} models available.`
              : testResult.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={isSaving || isTesting}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={isSaving || isTesting}
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlugZap className="mr-2 h-4 w-4" />
          )}
          Test connection
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

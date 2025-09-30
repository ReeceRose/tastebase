"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Server,
  Zap,
} from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Separator } from "@/components/ui/separator";
import {
  getDefaultModelForProvider,
  getProviderDisplayName,
  requiresApiKey,
} from "@/lib/ai/providers";
import {
  saveAIProviderConfig,
  validateAIProvider,
} from "@/lib/server-actions/ai-config-actions";
import {
  AIProvider,
  type AIProviderValue,
  DEFAULT_TASK_TOKEN_LIMITS,
} from "@/lib/types";

const aiProviderSchema = z
  .object({
    provider: z.enum([
      AIProvider.OPENAI,
      AIProvider.ANTHROPIC,
      AIProvider.GOOGLE,
      AIProvider.OLLAMA,
      AIProvider.NONE,
    ]),
    apiKey: z.string().optional(),
    modelName: z.string().optional(),
    ollamaHost: z.string().url().optional(),
    maxTokens: z.number().min(100).max(200000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    taskSpecificTokenLimits: z
      .object({
        "recipe-parsing": z.number().min(100).max(200000).optional(),
        "chat-conversation": z.number().min(100).max(200000).optional(),
        "recipe-discovery": z.number().min(100).max(200000).optional(),
        "cooking-assistance": z.number().min(100).max(200000).optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.provider === AIProvider.NONE) return true;
      if (data.provider === AIProvider.OLLAMA) return true;
      return data.apiKey && data.apiKey.length > 0;
    },
    {
      message: "API key is required for cloud providers",
      path: ["apiKey"],
    },
  );

type AIProviderFormData = z.infer<typeof aiProviderSchema>;

interface AIProviderSetupFormProps {
  onComplete?: (config: AIProviderFormData) => void;
  showTitle?: boolean;
  initialProvider?: AIProvider;
}

export function AIProviderSetupForm({
  onComplete,
  showTitle = true,
  initialProvider = AIProvider.NONE,
}: AIProviderSetupFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const apiKeyId = useId();
  const ollamaHostId = useId();

  const form = useForm<AIProviderFormData>({
    resolver: zodResolver(aiProviderSchema),
    defaultValues: {
      provider: initialProvider,
      apiKey: "",
      modelName: "",
      ollamaHost: "http://localhost:11434",
      maxTokens: 4000,
      temperature: 0.7,
      taskSpecificTokenLimits: DEFAULT_TASK_TOKEN_LIMITS,
    },
  });

  const selectedProvider = form.watch("provider") as AIProviderValue;
  const requiresApiKeyForProvider = requiresApiKey(selectedProvider);
  const defaultModel = getDefaultModelForProvider(selectedProvider);

  const providerOptions = [
    {
      value: AIProvider.OLLAMA,
      label: "Ollama (Local)",
      description: "Run AI models locally on your machine",
      icon: Server,
      badge: "Free",
      recommended: true,
    },
    {
      value: AIProvider.OPENAI,
      label: "OpenAI",
      description: "GPT-4 and other OpenAI models",
      icon: Bot,
      badge: "Paid API",
    },
    {
      value: AIProvider.ANTHROPIC,
      label: "Anthropic",
      description: "Claude models for advanced reasoning",
      icon: Zap,
      badge: "Paid API",
    },
    {
      value: AIProvider.GOOGLE,
      label: "Google",
      description: "Gemini models with large context",
      icon: Globe,
      badge: "Paid API",
    },
    {
      value: AIProvider.NONE,
      label: "No AI",
      description: "Manual recipe entry only",
      icon: AlertTriangle,
      badge: "Manual",
    },
  ];

  const handleValidateProvider = async () => {
    const formData = form.getValues();

    if (formData.provider === AIProvider.NONE) {
      setValidationResult({ valid: true });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const config = {
        provider: formData.provider,
        apiKey: formData.apiKey,
        modelName: formData.modelName || defaultModel,
        ollamaHost: formData.ollamaHost,
      };

      const result = await validateAIProvider(config);

      if (result.success && result.data) {
        setValidationResult({
          valid: result.data.valid,
          error: result.data.error?.error,
        });
      } else {
        setValidationResult({
          valid: false,
          error: result.error || "Validation failed",
        });
      }
    } catch {
      setValidationResult({
        valid: false,
        error: "Validation failed",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: AIProviderFormData) => {
    setIsSaving(true);

    try {
      const result = await saveAIProviderConfig({
        provider: data.provider,
        apiKey: data.apiKey,
        modelName: data.modelName || defaultModel,
        ollamaHost: data.ollamaHost,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        taskSpecificTokenLimits: data.taskSpecificTokenLimits
          ? JSON.stringify(data.taskSpecificTokenLimits)
          : undefined,
        isActive: true,
      });

      if (result.success) {
        onComplete?.(data);
      } else {
        form.setError("root", {
          message: result.error || "Failed to save configuration",
        });
      }
    } catch {
      form.setError("root", { message: "Failed to save configuration" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>AI Provider Setup</CardTitle>
          <CardDescription>
            Choose an AI provider to enable intelligent recipe parsing and
            assistance
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Provider</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-4"
                    >
                      {providerOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3"
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={option.value}
                            />
                            <Label
                              htmlFor={option.value}
                              className="flex-1 flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center space-x-3">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {option.label}
                                    </span>
                                    <Badge
                                      variant={
                                        option.recommended
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {option.badge}
                                    </Badge>
                                    {option.recommended && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Recommended
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {option.description}
                                  </p>
                                </div>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedProvider !== AIProvider.NONE && (
              <>
                <Separator />

                {requiresApiKeyForProvider && (
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={apiKeyId}>API Key</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id={apiKeyId}
                              type={showApiKey ? "text" : "password"}
                              placeholder={`Enter your ${getProviderDisplayName(selectedProvider)} API key`}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedProvider === AIProvider.OLLAMA && (
                  <FormField
                    control={form.control}
                    name="ollamaHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={ollamaHostId}>
                          Ollama Host
                        </FormLabel>
                        <FormControl>
                          <Input
                            id={ollamaHostId}
                            placeholder="http://localhost:11434"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="modelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || defaultModel}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProvider === AIProvider.OPENAI && (
                              <>
                                <SelectItem value="gpt-4o-mini">
                                  GPT-4o Mini (Recommended)
                                </SelectItem>
                                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                <SelectItem value="gpt-4-turbo">
                                  GPT-4 Turbo
                                </SelectItem>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                              </>
                            )}
                            {selectedProvider === AIProvider.ANTHROPIC && (
                              <>
                                <SelectItem value="claude-3-5-sonnet-20241022">
                                  Claude 3.5 Sonnet (Recommended)
                                </SelectItem>
                                <SelectItem value="claude-3-haiku-20240307">
                                  Claude 3 Haiku
                                </SelectItem>
                                <SelectItem value="claude-3-opus-20240229">
                                  Claude 3 Opus
                                </SelectItem>
                              </>
                            )}
                            {selectedProvider === AIProvider.GOOGLE && (
                              <>
                                <SelectItem value="gemini-2.5-flash">
                                  Gemini 2.5 Flash (Recommended)
                                </SelectItem>
                                <SelectItem value="gemini-2.5-flash-lite">
                                  Gemini 2.5 Flash Lite
                                </SelectItem>
                                <SelectItem value="gemini-1.5-pro">
                                  Gemini 1.5 Pro
                                </SelectItem>
                                <SelectItem value="gemini-1.5-flash">
                                  Gemini 1.5 Flash
                                </SelectItem>
                                <SelectItem value="gemini-2.0-flash-exp">
                                  Gemini 2.0 Flash (Experimental)
                                </SelectItem>
                              </>
                            )}
                            {selectedProvider === AIProvider.OLLAMA && (
                              <>
                                <SelectItem value="llama3.2">
                                  Llama 3.2 (Recommended)
                                </SelectItem>
                                <SelectItem value="llama3.1">
                                  Llama 3.1
                                </SelectItem>
                                <SelectItem value="qwen2.5">
                                  Qwen 2.5
                                </SelectItem>
                                <SelectItem value="codegemma">
                                  CodeGemma
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">
                      Token Limits by Task
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Configure maximum tokens for different AI tasks. Higher
                      limits allow longer conversations but increase costs.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="taskSpecificTokenLimits.recipe-parsing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipe Parsing</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={100}
                              max={200000}
                              placeholder="4000"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                                )
                              }
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            For parsing recipes from text or URLs
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taskSpecificTokenLimits.chat-conversation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat Conversations</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={100}
                              max={200000}
                              placeholder="12000"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                                )
                              }
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            For back-and-forth cooking assistance
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taskSpecificTokenLimits.recipe-discovery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipe Discovery</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={100}
                              max={200000}
                              placeholder="8000"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                                )
                              }
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            For finding and suggesting recipes
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taskSpecificTokenLimits.cooking-assistance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cooking Assistance</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={100}
                              max={200000}
                              placeholder="16000"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                                )
                              }
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            For detailed cooking help and troubleshooting
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidateProvider}
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </div>

                {validationResult && (
                  <Alert
                    variant={validationResult.valid ? "default" : "destructive"}
                  >
                    {validationResult.valid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {validationResult.valid
                        ? "Connection successful! Your AI provider is working correctly."
                        : `Connection failed: ${validationResult.error}`}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

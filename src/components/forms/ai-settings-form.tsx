"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bot,
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  Info,
  Loader2,
  Plus,
  Server,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import {
  getDefaultModelForProvider,
  getProviderDisplayName,
  requiresApiKey,
} from "@/lib/ai";
import { maskApiKey } from "@/lib/crypto/utils";
import {
  deleteAIProviderConfig,
  getAIUsageStats,
  getUserAIConfig,
  saveAIProviderConfig,
  updateAIProviderConfig,
  validateAIProvider,
} from "@/lib/server-actions/ai-config-actions";
import {
  AIProvider,
  type AIProviderConfig,
  DEFAULT_TASK_TOKEN_LIMITS,
  ImageProcessingMethod,
  type TaskSpecificTokenLimits,
} from "@/lib/types";

interface AIUsageStats {
  stats: Array<{
    id: string;
    userId: string;
    taskType: string;
    provider: string;
    success: boolean;
    inputTokens?: number | null;
    outputTokens?: number | null;
    responseTime?: number | null;
    createdAt: Date;
    updatedAt?: Date | null;
  }>;
  summary: {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    averageResponseTime: number;
    tasksByType: Record<string, number>;
    tasksByProvider: Record<string, number>;
  };
}

const aiSettingsSchema = z.object({
  provider: z.enum([
    AIProvider.OPENAI,
    AIProvider.ANTHROPIC,
    AIProvider.GOOGLE,
    AIProvider.OLLAMA,
    AIProvider.NONE,
  ]),
  apiKey: z.string().optional(),
  modelName: z.string().optional(),
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
  ollamaHost: z.string().url().optional(),
  enabledTasks: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  imageProcessingMethod: z
    .enum([
      ImageProcessingMethod.AUTO,
      ImageProcessingMethod.AI_VISION,
      ImageProcessingMethod.OCR,
    ])
    .optional(),
});

type AISettingsFormData = z.infer<typeof aiSettingsSchema>;

export function AISettingsForm() {
  const [configurations, setConfigurations] = useState<AIProviderConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<AIProviderConfig | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIProviderConfig | null>(
    null,
  );
  const [originalImageProcessingMethod, setOriginalImageProcessingMethod] =
    useState<ImageProcessingMethod>(ImageProcessingMethod.AUTO);

  const apiKeyId = useId();
  const ollamaHostId = useId();
  const maxTokensId = useId();
  const temperatureId = useId();
  const autoId = useId();
  const aiVisionId = useId();
  const ocrId = useId();

  const form = useForm<AISettingsFormData>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      provider: AIProvider.NONE,
      apiKey: "",
      modelName: "",
      maxTokens: 4000,
      temperature: 0.7,
      taskSpecificTokenLimits: DEFAULT_TASK_TOKEN_LIMITS,
      ollamaHost: "http://localhost:11434",
      enabledTasks: ["recipe-parsing"],
      isActive: false,
      imageProcessingMethod: ImageProcessingMethod.AUTO,
    },
  });

  const selectedProvider = form.watch("provider");
  const currentImageProcessingMethod = form.watch("imageProcessingMethod");
  const requiresApiKeyForProvider = requiresApiKey(selectedProvider);

  // Auto-set default model when provider changes (for new configurations)
  useEffect(() => {
    if (!editingConfig && selectedProvider !== AIProvider.NONE) {
      const defaultModel = getDefaultModelForProvider(selectedProvider);
      if (defaultModel) {
        form.setValue("modelName", defaultModel);
      }
    }
  }, [selectedProvider, form, editingConfig]);

  // Check if image processing settings have changed
  const imageProcessingHasChanged =
    currentImageProcessingMethod !== originalImageProcessingMethod;

  const loadConfigurations = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUserAIConfig();
      if (result.success && result.data) {
        setConfigurations(result.data.configurations);
        setActiveConfig(result.data.activeConfiguration || null);

        if (result.data.activeConfiguration) {
          const imageProcessingMethod =
            (result.data.activeConfiguration
              .imageProcessingMethod as ImageProcessingMethod) ||
            ImageProcessingMethod.AUTO;

          // Pre-populate form with active configuration
          form.reset({
            provider: result.data.activeConfiguration.provider as AIProvider,
            apiKey: result.data.activeConfiguration.apiKey || "",
            modelName: result.data.activeConfiguration.modelName || "",
            maxTokens: result.data.activeConfiguration.maxTokens || 4000,
            temperature: result.data.activeConfiguration.temperature || 0.7,
            ollamaHost:
              result.data.activeConfiguration.ollamaHost ||
              "http://localhost:11434",
            enabledTasks: result.data.activeConfiguration.enabledTasks?.split(
              ",",
            ) || ["recipe-parsing"],
            isActive: result.data.activeConfiguration.isActive,
            imageProcessingMethod,
          });

          // Store original value for change detection
          setOriginalImageProcessingMethod(imageProcessingMethod);
        }
      }
    } catch {
      toast.error("Failed to load AI configurations");
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  const loadUsageStats = useCallback(async () => {
    try {
      const result = await getAIUsageStats(30);
      if (result.success && result.data) {
        setUsageStats(result.data);
      }
    } catch {
      // Silently fail for usage stats
    }
  }, []);

  useEffect(() => {
    loadConfigurations();
    loadUsageStats();
  }, [loadConfigurations, loadUsageStats]);

  const handleSaveConfiguration = async (data: AISettingsFormData) => {
    setIsSaving(true);
    try {
      const configData = {
        provider: data.provider,
        apiKey: data.apiKey,
        modelName: data.modelName,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        taskSpecificTokenLimits: data.taskSpecificTokenLimits
          ? JSON.stringify(data.taskSpecificTokenLimits)
          : undefined,
        ollamaHost: data.ollamaHost,
        enabledTasks: data.enabledTasks?.join(","),
        isActive: data.isActive,
        imageProcessingMethod: data.imageProcessingMethod,
      };

      let result: { success: boolean; error?: string };
      if (editingConfig?.id) {
        // Update existing configuration
        result = await updateAIProviderConfig(editingConfig.id, configData);
      } else {
        // Create new configuration
        result = await saveAIProviderConfig(configData);
      }

      if (result.success) {
        toast.success(
          editingConfig
            ? "AI configuration updated successfully"
            : "AI configuration saved successfully",
        );
        setShowAddForm(false);
        setEditingConfig(null);
        await loadConfigurations();
      } else {
        toast.error(result.error || "Failed to save configuration");
      }
    } catch {
      toast.error("Failed to save AI configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    try {
      const result = await deleteAIProviderConfig(configId);
      if (result.success) {
        toast.success("Configuration deleted");
        await loadConfigurations();
      } else {
        toast.error(result.error || "Failed to delete configuration");
      }
    } catch {
      toast.error("Failed to delete configuration");
    }
  };

  const handleValidateProvider = async () => {
    const formData = form.getValues();

    if (formData.provider === AIProvider.NONE) return;

    setIsValidating(true);
    try {
      const config = {
        provider: formData.provider,
        apiKey: formData.apiKey,
        modelName: formData.modelName,
        ollamaHost: formData.ollamaHost,
      };

      const result = await validateAIProvider(config);

      if (result.success && result.data?.valid) {
        toast.success("Provider validated successfully");
      } else {
        toast.error(
          `Validation failed: ${result.data?.error?.error || result.error}`,
        );
      }
    } catch {
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSetActive = async (configId: string) => {
    try {
      const result = await updateAIProviderConfig(configId, { isActive: true });
      if (result.success) {
        toast.success("Active configuration updated");
        await loadConfigurations();
      } else {
        toast.error(result.error || "Failed to update configuration");
      }
    } catch {
      toast.error("Failed to update configuration");
    }
  };

  const handleEditConfiguration = (config: AIProviderConfig) => {
    setEditingConfig(config);
    setShowAddForm(false);

    // Parse task-specific token limits
    let taskSpecificLimits: TaskSpecificTokenLimits = DEFAULT_TASK_TOKEN_LIMITS;
    if (config.taskSpecificTokenLimits) {
      try {
        taskSpecificLimits = JSON.parse(config.taskSpecificTokenLimits);
      } catch {
        // Use defaults on parse error
      }
    }

    // Pre-populate form with config data
    form.reset({
      provider: config.provider as AIProvider,
      apiKey: config.apiKey || "",
      modelName: config.modelName || "",
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7,
      taskSpecificTokenLimits: taskSpecificLimits,
      ollamaHost: config.ollamaHost || "http://localhost:11434",
      enabledTasks: config.enabledTasks?.split(",") || ["recipe-parsing"],
      isActive: config.isActive,
      imageProcessingMethod:
        (config.imageProcessingMethod as ImageProcessingMethod) ||
        ImageProcessingMethod.AUTO,
    });
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    form.reset({
      provider: AIProvider.NONE,
      apiKey: "",
      modelName: "",
      maxTokens: 4000,
      temperature: 0.7,
      taskSpecificTokenLimits: DEFAULT_TASK_TOKEN_LIMITS,
      ollamaHost: "http://localhost:11434",
      enabledTasks: ["recipe-parsing"],
      isActive: false,
      imageProcessingMethod: ImageProcessingMethod.AUTO,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <CardTitle>AI Provider Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <CardTitle>AI Provider Settings</CardTitle>
            </div>
            {!showAddForm && !editingConfig && (
              <Button
                onClick={() => {
                  setShowAddForm(true);
                  // Reset form to clean defaults when adding new provider
                  form.reset({
                    provider: AIProvider.NONE,
                    apiKey: "",
                    modelName: "",
                    maxTokens: 4000,
                    temperature: 0.7,
                    taskSpecificTokenLimits: DEFAULT_TASK_TOKEN_LIMITS,
                    ollamaHost: "http://localhost:11434",
                    enabledTasks: ["recipe-parsing"],
                    isActive: false,
                    imageProcessingMethod: ImageProcessingMethod.AUTO,
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            )}
          </div>
          <CardDescription>
            Configure AI providers for intelligent recipe parsing and assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Configurations */}
          {configurations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Current Configurations</h4>
              <div className="grid gap-4">
                {configurations.map((config) => {
                  const isActive = config.isActive;
                  const providerIcon =
                    config.provider === AIProvider.OLLAMA
                      ? Server
                      : config.provider === AIProvider.OPENAI
                        ? Bot
                        : config.provider === AIProvider.ANTHROPIC
                          ? Zap
                          : Globe;
                  const ProviderIcon = providerIcon;

                  return (
                    <Card
                      key={config.id}
                      className={isActive ? "border-primary" : ""}
                    >
                      <CardContent className="py-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ProviderIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {getProviderDisplayName(
                                    config.provider as AIProvider,
                                  )}
                                </span>
                                {isActive && (
                                  <Badge variant="default">Active</Badge>
                                )}
                                {config.provider === AIProvider.OLLAMA && (
                                  <Badge variant="outline">Local</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Model: {config.modelName || "Default"}
                                {config.apiKey && (
                                  <span className="ml-2">
                                    API Key: {maskApiKey(config.apiKey)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  config.id && handleSetActive(config.id)
                                }
                              >
                                Set Active
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditConfiguration(config)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                config.id &&
                                handleDeleteConfiguration(config.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {configurations.length === 0 && (
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                No AI providers configured. Add a provider to enable intelligent
                recipe features.
              </AlertDescription>
            </Alert>
          )}

          {/* Add/Edit Configuration Form */}
          {(showAddForm || editingConfig) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingConfig ? "Edit AI Provider" : "Add AI Provider"}
                </CardTitle>
                <CardDescription>
                  {editingConfig
                    ? "Update your AI provider configuration"
                    : "Configure a new AI provider for recipe assistance"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSaveConfiguration)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select AI provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={AIProvider.OLLAMA}>
                                  Ollama (Local)
                                </SelectItem>
                                <SelectItem value={AIProvider.OPENAI}>
                                  OpenAI
                                </SelectItem>
                                <SelectItem value={AIProvider.ANTHROPIC}>
                                  Anthropic
                                </SelectItem>
                                <SelectItem value={AIProvider.GOOGLE}>
                                  Google
                                </SelectItem>
                                <SelectItem value={AIProvider.NONE}>
                                  No AI
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                  placeholder="Enter API key"
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

                    {selectedProvider !== AIProvider.NONE && (
                      <FormField
                        control={form.control}
                        name="modelName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value || ""}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedProvider === AIProvider.OPENAI && (
                                    <>
                                      <SelectItem value="gpt-5-mini">
                                        GPT-5 Mini (Recommended)
                                      </SelectItem>
                                      <SelectItem value="gpt-5">
                                        GPT-5
                                      </SelectItem>
                                      <SelectItem value="gpt-4o-mini">
                                        GPT-4o Mini
                                      </SelectItem>
                                      <SelectItem value="gpt-4o">
                                        GPT-4o
                                      </SelectItem>
                                      <SelectItem value="gpt-4-turbo">
                                        GPT-4 Turbo
                                      </SelectItem>
                                      <SelectItem value="gpt-4">
                                        GPT-4
                                      </SelectItem>
                                    </>
                                  )}
                                  {selectedProvider ===
                                    AIProvider.ANTHROPIC && (
                                    <>
                                      <SelectItem value="claude-sonnet-4-latest">
                                        Claude Sonnet 4 (Recommended)
                                      </SelectItem>
                                      <SelectItem value="claude-3-5-sonnet-latest">
                                        Claude 3.5 Sonnet (Latest)
                                      </SelectItem>
                                      <SelectItem value="claude-3-5-sonnet-20241022">
                                        Claude 3.5 Sonnet
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
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor={maxTokensId}>
                              Max Tokens
                            </FormLabel>
                            <FormControl>
                              <Input
                                id={maxTokensId}
                                type="number"
                                min={100}
                                max={200000}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor={temperatureId}>
                              Temperature
                            </FormLabel>
                            <FormControl>
                              <Input
                                id={temperatureId}
                                type="number"
                                min={0}
                                max={2}
                                step={0.1}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Task-Specific Token Limits */}
                    {selectedProvider !== AIProvider.NONE && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium">
                            Token Limits by Task
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Configure maximum tokens for different AI tasks.
                            Higher limits allow longer conversations but
                            increase costs.
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
                    )}

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Set as Active
                            </FormLabel>
                            <FormDescription>
                              Make this the default AI provider for recipe tasks
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidateProvider}
                        disabled={
                          isValidating || selectedProvider === AIProvider.NONE
                        }
                      >
                        {isValidating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Test Connection
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Settings className="mr-2 h-4 w-4" />
                        )}
                        Save Configuration
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false);
                          handleCancelEdit();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Image Processing Settings */}
      {activeConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Processing Settings
            </CardTitle>
            <CardDescription>
              Choose how recipe images are processed for text extraction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <FormField
                control={form.control}
                name="imageProcessingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processing Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem
                            value={ImageProcessingMethod.AUTO}
                            id={autoId}
                          />
                          <Label
                            htmlFor={autoId}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                Auto (Recommended)
                              </span>
                              <Badge variant="outline">Smart</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Uses AI Vision when available, falls back to local
                              OCR. Best balance of accuracy and privacy.
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem
                            value={ImageProcessingMethod.AI_VISION}
                            id={aiVisionId}
                          />
                          <Label
                            htmlFor={aiVisionId}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">
                                AI Vision Only
                              </span>
                              <Badge variant="outline">Enhanced</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Highest accuracy using AI vision models. Better
                              for handwritten and complex recipes.
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem
                            value={ImageProcessingMethod.OCR}
                            id={ocrId}
                          />
                          <Label
                            htmlFor={ocrId}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                Local OCR Only
                              </span>
                              <Badge variant="outline">Private</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Complete privacy, works offline. Best for printed
                              recipes and text.
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div>
                  <strong>Processing Method Comparison:</strong>
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    • <strong>Auto:</strong> Smart selection based on your AI
                    setup
                  </div>
                  <div>
                    • <strong>AI Vision:</strong> Cloud processing, highest
                    accuracy for complex images
                  </div>
                  <div>
                    • <strong>Local OCR:</strong> Private processing, works
                    offline, good for printed text
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {imageProcessingHasChanged && (
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (activeConfig?.id) {
                      const result = await updateAIProviderConfig(
                        activeConfig.id,
                        {
                          imageProcessingMethod: form.getValues(
                            "imageProcessingMethod",
                          ),
                        },
                      );
                      if (result.success) {
                        toast.success("Image processing settings saved");
                        // Update original value after successful save for change detection
                        setOriginalImageProcessingMethod(
                          currentImageProcessingMethod ||
                            ImageProcessingMethod.AUTO,
                        );

                        // Optimistically update activeConfig
                        if (activeConfig) {
                          setActiveConfig({
                            ...activeConfig,
                            imageProcessingMethod: currentImageProcessingMethod,
                          });
                        }
                      } else {
                        toast.error("Failed to save settings");
                      }
                    }
                  }}
                >
                  Save Image Processing Settings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {usageStats.summary.totalTasks}
                </div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {usageStats.summary.successfulTasks}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {usageStats.summary.totalInputTokens.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Input Tokens
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {usageStats.summary.totalOutputTokens.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Output Tokens
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

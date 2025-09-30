"use client";

import {
  ArrowRight,
  Bot,
  Brain,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { AIProviderSetupForm } from "@/components/forms/ai-provider-setup-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AIOnboardingCardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function AIOnboardingCard({
  onComplete,
  onSkip,
}: AIOnboardingCardProps) {
  const [showSetup, setShowSetup] = useState(false);

  const benefits = [
    {
      icon: Sparkles,
      title: "Smart Recipe Parsing",
      description:
        "Paste any recipe text and let AI extract ingredients, instructions, and details automatically",
    },
    {
      icon: Clock,
      title: "Save Time",
      description:
        "No more manual data entry - AI handles the tedious work of organizing recipe information",
    },
    {
      icon: Brain,
      title: "Recipe Assistance",
      description:
        "Get cooking tips, ingredient substitutions, and recipe modifications through AI chat",
    },
    {
      icon: Bot,
      title: "Recipe Discovery",
      description:
        "Find recipes based on ingredients you have or dietary preferences",
    },
  ];

  if (showSetup) {
    return (
      <AIProviderSetupForm
        onComplete={() => {
          setShowSetup(false);
          onComplete?.();
        }}
        showTitle={false}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          Enhance Your Recipe Experience with AI
        </CardTitle>
        <CardDescription className="text-lg">
          Add intelligent features to make recipe management faster and more
          enjoyable
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium mb-2">Choose Your AI Provider</h4>
            <p className="text-sm text-muted-foreground">
              Select from local or cloud-based AI providers based on your
              preferences
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Ollama (Local)</h5>
                <Badge variant="outline">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Run AI models on your own machine. Free, private, and no
                internet required.
              </p>
              <div className="flex text-xs text-muted-foreground space-x-4">
                <span>✓ Free</span>
                <span>✓ Private</span>
                <span>✓ Offline</span>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Cloud Providers</h5>
                <Badge variant="secondary">Paid API</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                OpenAI, Anthropic, or Google AI. Requires API key and internet
                connection.
              </p>
              <div className="flex text-xs text-muted-foreground space-x-4">
                <span>✓ Fast</span>
                <span>✓ Powerful</span>
                <span>✓ Latest models</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setShowSetup(true)} className="flex-1">
            Set Up AI Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip for Now
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            You can always configure AI settings later in your account settings
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

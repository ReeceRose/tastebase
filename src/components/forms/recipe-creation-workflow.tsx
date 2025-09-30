"use client";

import { Bot, FileText, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AIRecipeParser } from "@/components/forms/ai-recipe-parser";
import { RecipeCreateForm } from "@/components/forms/recipe-create-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecipeParsingResult } from "@/lib/types";
import { RecipeDifficulty } from "@/lib/types";
import type { RecipeFormData } from "@/lib/types/recipe-types";
import type { AIRecipeParsingResult } from "@/lib/validations/recipe-schemas";

interface RecipeCreationWorkflowProps {
  userId: string;
}

export function RecipeCreationWorkflow({
  userId,
}: RecipeCreationWorkflowProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("ai");
  const [aiParsedData, setAiParsedData] =
    useState<Partial<RecipeFormData> | null>(null);
  const [fromChat, setFromChat] = useState(false);

  const transformChatDataToFormData = useCallback(
    (chatData: AIRecipeParsingResult): Partial<RecipeFormData> => {
      return {
        title: chatData.title || "",
        description: chatData.description || "",
        servings: chatData.servings || 4,
        prepTimeMinutes: chatData.prepTime || undefined,
        cookTimeMinutes: chatData.cookTime || undefined,
        difficulty:
          (chatData.difficulty as RecipeDifficulty) || RecipeDifficulty.MEDIUM,
        cuisine: chatData.cuisine || "",
        sourceUrl: "",
        sourceName: "Recipe Discovery Chat",
        ingredients:
          chatData.ingredients?.map((ing) => ({
            name: ing.name || "",
            amount: ing.quantity || undefined,
            unit: ing.unit || "",
            notes: "",
            groupName: "",
            isOptional: false,
          })) || [],
        instructions:
          chatData.instructions?.map((inst) => ({
            instruction: inst.instruction || "",
            timeMinutes: inst.timeMinutes || undefined,
            temperature: inst.temperature || "",
            notes: "",
            groupName: "",
          })) || [],
        tags: chatData.tags || [],
        isPublic: false,
      };
    },
    [],
  );

  // Handle chat data from URL parameters
  useEffect(() => {
    const fromChatParam = searchParams.get("fromChat");
    const dataParam = searchParams.get("data");

    if (fromChatParam === "true" && dataParam) {
      try {
        const chatParsedData: AIRecipeParsingResult = JSON.parse(dataParam);
        setFromChat(true);

        // Transform chat parsed data to form data
        const formData: Partial<RecipeFormData> =
          transformChatDataToFormData(chatParsedData);

        setAiParsedData(formData);
        setActiveTab("manual");
      } catch (error) {
        console.error("Failed to parse chat data:", error);
      }
    }
  }, [searchParams, transformChatDataToFormData]);

  const handleRecipeParsed = (parsed: RecipeParsingResult) => {
    // Transform AI parsing result to form data
    const formData: Partial<RecipeFormData> = {
      title: parsed.title || "",
      description: parsed.description || "",
      servings: parsed.servings || 4,
      prepTimeMinutes: parsed.prepTime || 0,
      cookTimeMinutes: parsed.cookTime || 0,
      difficulty:
        (parsed.difficulty as RecipeDifficulty) || RecipeDifficulty.MEDIUM,
      cuisine: parsed.cuisine || "",
      sourceUrl: "",
      sourceName: "",
      ingredients:
        parsed.ingredients?.map((ing) => ({
          name: ing.name || "",
          amount: ing.quantity || undefined,
          unit: ing.unit || "",
          notes: "",
          groupName: "",
          isOptional: false,
        })) || [],
      instructions:
        parsed.instructions?.map((inst) => ({
          instruction: inst.instruction || "",
          timeMinutes: inst.timeMinutes || undefined,
          temperature: inst.temperature || "",
          notes: "",
          groupName: "",
        })) || [],
      tags: parsed.tags || [],
      isPublic: false,
    };

    setAiParsedData(formData);
    setActiveTab("manual");
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Import Recipe
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Create Manually
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Import Recipe
              </CardTitle>
              <CardDescription>
                Import a recipe from a webpage, paste recipe text, or upload an
                image. Our AI will extract the ingredients, instructions, and
                details automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIRecipeParser
                userId={userId}
                onRecipeParsed={handleRecipeParsed}
                disabled={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {fromChat ? (
                  <>
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Recipe from Chat Discovery
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Create Recipe Manually
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {fromChat
                  ? "Your AI-discovered recipe has been parsed and pre-filled below. Review and edit the details, then save to your collection."
                  : aiParsedData
                    ? "Review and edit the imported recipe details below, then save your recipe."
                    : "Enter your recipe details manually using the form below."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecipeCreateForm
                initialData={aiParsedData || undefined}
                onSuccess={() => {
                  // Optional: Handle success callback
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

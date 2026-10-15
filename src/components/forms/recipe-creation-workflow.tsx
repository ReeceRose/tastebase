"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { RecipeCreateForm } from "@/components/forms/recipe-create-form";
import { RecipeImportForm } from "@/components/forms/recipe-import-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecipeImportResult } from "@/lib/types/import-types";
import type { RecipeFormData } from "@/lib/types/recipe-types";
import { mapImportResultToFormData } from "@/lib/utils/recipe-import-mapping";

enum CreationTab {
  IMPORT = "import",
  MANUAL = "manual",
}

export function RecipeCreationWorkflow() {
  const [activeTab, setActiveTab] = useState<string>(CreationTab.IMPORT);
  const [importedData, setImportedData] =
    useState<Partial<RecipeFormData> | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleImported = (result: RecipeImportResult) => {
    setImportedData(mapImportResultToFormData(result));
    setFormKey((key) => key + 1);
    setActiveTab(CreationTab.MANUAL);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value={CreationTab.IMPORT} className="gap-2">
          <Download className="h-4 w-4" />
          Import Recipe
        </TabsTrigger>
        <TabsTrigger value={CreationTab.MANUAL} className="gap-2">
          <FileText className="h-4 w-4" />
          {importedData ? "Review Recipe" : "Create Manually"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={CreationTab.IMPORT}>
        <Card>
          <CardHeader>
            <CardTitle>Import Recipe</CardTitle>
            <CardDescription>
              Import from a recipe link, pasted text or a photo. You can review
              everything before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecipeImportForm onImported={handleImported} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value={CreationTab.MANUAL}>
        <Card>
          <CardHeader>
            <CardTitle>
              {importedData
                ? "Review Imported Recipe"
                : "Create Recipe Manually"}
            </CardTitle>
            <CardDescription>
              {importedData
                ? "Check the imported details, then save the recipe."
                : "Enter your recipe details using the form below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecipeCreateForm
              key={formKey}
              initialData={importedData ?? undefined}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

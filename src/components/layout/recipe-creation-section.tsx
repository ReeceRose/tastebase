import { RecipeCreationWorkflow } from "@/components/forms/recipe-creation-workflow";
import { getDefaultRecipeIsPublic } from "@/lib/server-actions/sharing-preference-actions";

interface RecipeCreationSectionProps {
  userId: string;
  fromExtension: boolean;
  sharedUrl: string | null;
}

export async function RecipeCreationSection({
  userId,
  fromExtension,
  sharedUrl,
}: RecipeCreationSectionProps) {
  const defaultIsPublic = await getDefaultRecipeIsPublic();

  return (
    <RecipeCreationWorkflow
      userId={userId}
      fromExtension={fromExtension}
      sharedUrl={sharedUrl}
      defaultIsPublic={defaultIsPublic}
    />
  );
}

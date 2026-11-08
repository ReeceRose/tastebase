import { Panel } from "@/components/ui/panel";

interface RecipeExtraNotesPanelProps {
  notes: string | null;
}

export function RecipeExtraNotesPanel({ notes }: RecipeExtraNotesPanelProps) {
  if (!notes) return null;

  return (
    <Panel title="Recipe notes">
      <p className="whitespace-pre-line text-body">{notes}</p>
    </Panel>
  );
}

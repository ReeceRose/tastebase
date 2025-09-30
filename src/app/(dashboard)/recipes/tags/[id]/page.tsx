import { Suspense } from "react";
import { RecipeTagDetail } from "@/components/lists/recipe-tag-detail";
import { RecipeCardGridSkeleton } from "@/components/skeletons/recipe-card-skeleton";

interface TagDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Tag Details | Tastebase",
  description: "View recipes with specific tags",
};

export default async function TagDetailPage({ params }: TagDetailPageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <Suspense fallback={<RecipeCardGridSkeleton count={6} />}>
        <RecipeTagDetail tagId={id} />
      </Suspense>
    </div>
  );
}

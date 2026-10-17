import { notFound, redirect } from "next/navigation";
import { getTagNameById } from "@/lib/server-actions/recipe-tags-actions";

interface TagDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TagDetailRedirect({
  params,
}: TagDetailPageProps) {
  const { id } = await params;
  const name = await getTagNameById(id);
  if (!name) notFound();
  redirect(`/recipes?tag=${encodeURIComponent(name)}`);
}

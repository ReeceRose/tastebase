import { redirect } from "next/navigation";
import {
  type LibrarySearchParams,
  libraryParamsToQuery,
  parseLibraryParams,
} from "@/lib/utils/library-params";

interface SearchPageProps {
  searchParams: Promise<LibrarySearchParams>;
}

export default async function LegacyRecipeSearchRedirect({
  searchParams,
}: SearchPageProps) {
  const query = libraryParamsToQuery(parseLibraryParams(await searchParams));
  redirect(query ? `/recipes?${query}` : "/recipes");
}

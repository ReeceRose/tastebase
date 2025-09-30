import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

interface LegacySearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyRecipeSearchRedirect({
  searchParams,
}: LegacySearchPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) {
          query.append(key, item);
        }
      });
    } else {
      query.set(key, value);
    }
  });

  const target = query.toString() ? `/search?${query.toString()}` : "/search";

  redirect(target);
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TemplateList } from "@/components/lists/template-list";
import { auth } from "@/lib/auth/auth";

export const metadata = {
  title: "Templates - Tastebase",
  description: "Manage your custom recipe note templates",
};

export default async function TemplatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<TemplateListSkeleton />}>
        <TemplateList />
      </Suspense>
    </div>
  );
}

function TemplateListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted/30 rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-muted/30 rounded animate-pulse" />
      </div>

      <div className="h-32 bg-muted/30 rounded animate-pulse" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 w-20 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

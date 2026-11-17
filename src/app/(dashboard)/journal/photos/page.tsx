import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { JournalPhotoWall } from "@/components/lists/journal-photo-wall";
import { JournalPhotoWallSkeleton } from "@/components/skeletons/journal-skeletons";
import { auth } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Photo wall | Tastebase",
  description: "Every photo from your journal",
};

export default async function JournalPhotosPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Journal
      </Link>
      <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
        Photo wall
      </h1>
      <Suspense fallback={<JournalPhotoWallSkeleton />}>
        <JournalPhotoWall />
      </Suspense>
    </div>
  );
}

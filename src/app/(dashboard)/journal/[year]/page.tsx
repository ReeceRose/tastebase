import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { JournalYearReview } from "@/components/layout/journal-year-review";
import { JournalYearReviewSkeleton } from "@/components/skeletons/journal-skeletons";
import { auth } from "@/lib/auth/auth";
import { parseJournalYear } from "@/lib/utils/journal-lookback";

interface JournalYearPageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({
  params,
}: JournalYearPageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `${year} in the kitchen | Tastebase`,
    description: "Your year of cooking, looking back",
  };
}

export default async function JournalYearPage({
  params,
}: JournalYearPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const year = parseJournalYear((await params).year);
  if (!year) notFound();

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
        {year} in the kitchen
      </h1>
      <Suspense key={year} fallback={<JournalYearReviewSkeleton />}>
        <JournalYearReview year={year} currentUserId={session.user.id} />
      </Suspense>
    </div>
  );
}

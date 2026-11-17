import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { JournalMonthReview } from "@/components/layout/journal-month-review";
import { JournalMonthReviewSkeleton } from "@/components/skeletons/journal-skeletons";
import { auth } from "@/lib/auth/auth";
import {
  monthName,
  parseJournalMonth,
  parseJournalYear,
} from "@/lib/utils/journal-lookback";

interface MonthRouteParams {
  year: string;
  month: string;
}

interface JournalMonthPageProps {
  params: Promise<MonthRouteParams>;
}

async function readParams(params: Promise<MonthRouteParams>) {
  const raw = await params;
  const year = parseJournalYear(raw.year);
  const month = parseJournalMonth(raw.month);
  return year && month ? { year, month } : null;
}

export async function generateMetadata({
  params,
}: JournalMonthPageProps): Promise<Metadata> {
  const parsed = await readParams(params);
  return {
    title: parsed
      ? `${monthName(parsed.year, parsed.month, true)} in the kitchen | Tastebase`
      : "Journal | Tastebase",
    description: "Your month of cooking, looking back",
  };
}

export default async function JournalMonthPage({
  params,
}: JournalMonthPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const parsed = await readParams(params);
  if (!parsed) notFound();
  const { year, month } = parsed;

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
        {monthName(year, month, true)} in the kitchen
      </h1>
      <Suspense
        key={`${year}-${month}`}
        fallback={<JournalMonthReviewSkeleton />}
      >
        <JournalMonthReview
          year={year}
          month={month}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}

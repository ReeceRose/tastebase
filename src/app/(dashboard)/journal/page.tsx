import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  OldFavouritesSection,
  OnThisDaySection,
  YearSnapshotSection,
} from "@/components/layout/journal-lookback-sections";
import { JournalTimeline } from "@/components/lists/journal-timeline";
import { NewJournalEntryButton } from "@/components/modals/new-journal-entry-button";
import { JournalFilterLinks } from "@/components/navigation/journal-filter";
import {
  JournalCardSkeleton,
  JournalTimelineSkeleton,
} from "@/components/skeletons/journal-skeletons";
import { auth } from "@/lib/auth/auth";
import { ButtonVariant, ComponentSize } from "@/lib/types";
import { parseJournalFilter } from "@/lib/utils/journal";

export const metadata: Metadata = {
  title: "Journal | Tastebase",
  description: "What you've made and what you want to remember",
};

interface JournalPageProps {
  searchParams: Promise<{ show?: string | string[] }>;
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const { show } = await searchParams;
  const filter = parseJournalFilter(typeof show === "string" ? show : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
            Journal
          </h1>
          <p className="text-muted-foreground">
            What you've made, and anything worth remembering.
          </p>
        </div>
        <NewJournalEntryButton
          label="New entry"
          presetRecipe={null}
          variant={ButtonVariant.ACCENT}
          size={ComponentSize.MD}
          initiallyOpen={false}
        />
      </div>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:order-2">
          <Suspense fallback={null}>
            <OnThisDaySection />
          </Suspense>
          <Suspense fallback={<JournalCardSkeleton />}>
            <YearSnapshotSection />
          </Suspense>
          <Suspense fallback={null}>
            <OldFavouritesSection currentUserId={session.user.id} />
          </Suspense>
        </aside>
        <div className="min-w-0 space-y-6">
          <JournalFilterLinks current={filter} />
          <Suspense key={filter} fallback={<JournalTimelineSkeleton />}>
            <JournalTimeline filter={filter} currentUserId={session.user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ButtonVariant } from "@/lib/types";

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <span aria-hidden className="relative mb-8 block size-24">
          <span className="absolute inset-0 rounded-[50%_50%_50%_10px] bg-swatch-tomato" />
          <span className="absolute -right-3 -bottom-3 size-10 rounded-full bg-swatch-turmeric" />
        </span>
        <h1 className="text-title">That page didn't load</h1>
        <p className="mt-3 text-lead text-muted-foreground">
          Something went wrong on this server while loading it. Try again, or
          head back to your recipes.
        </p>
        {IS_DEVELOPMENT && (
          <pre className="mt-6 w-full overflow-x-auto rounded-control bg-card p-4 text-left font-mono text-caption whitespace-pre-wrap">
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ""}
          </pre>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Button size="lg" variant={ButtonVariant.OUTLINE} asChild>
            <Link href="/recipes">Back to recipes</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

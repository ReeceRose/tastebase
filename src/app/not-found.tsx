import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonVariant } from "@/lib/types";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <span aria-hidden className="relative mb-8 block size-24">
          <span className="absolute inset-0 rounded-full bg-swatch-sky" />
          <span className="absolute top-6 left-6 size-12 rounded-full bg-background" />
        </span>
        <h1 className="text-title">We couldn't find that</h1>
        <p className="mt-3 text-lead text-muted-foreground">
          The recipe or page may have been deleted, made private, or the link is
          slightly wrong.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/recipes">Back to recipes</Link>
          </Button>
          <Button size="lg" variant={ButtonVariant.OUTLINE} asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

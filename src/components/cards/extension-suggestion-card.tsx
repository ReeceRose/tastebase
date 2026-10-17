import { ArrowUpRight } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { ExtensionPresence } from "@/lib/types";

const EXTENSION_INSTALL_URL =
  "https://github.com/ReeceRose/tastebase/tree/main/extensions/chrome#install";

interface ExtensionSuggestionCardProps {
  presence: ExtensionPresence;
}

export function ExtensionSuggestionCard({
  presence,
}: ExtensionSuggestionCardProps) {
  if (presence === ExtensionPresence.INSTALLED) {
    return (
      <div className="rounded-tile bg-accent p-5 text-accent-foreground sm:p-6">
        <h2 className="text-heading">Saving from a recipe site?</h2>
        <p className="mt-2 max-w-[60ch]">
          Open the recipe and click Save to Tastebase in your toolbar, or press{" "}
          <Kbd className="border-accent-foreground/30 bg-transparent text-accent-foreground">
            Alt Shift T
          </Kbd>
          . It brings the photos along and works on sites that block link
          imports.
        </p>
      </div>
    );
  }

  if (presence === ExtensionPresence.MISSING) {
    return (
      <div className="flex flex-col gap-4 rounded-tile bg-accent p-5 text-accent-foreground sm:flex-row sm:items-center sm:p-6">
        <div className="flex-1">
          <h2 className="text-heading">Save recipes in one click</h2>
          <p className="mt-2 max-w-[60ch]">
            The Save to Tastebase extension grabs the recipe you're looking at,
            photos and all. It works on sites that block link imports and on
            subscriber sites you're signed in to.
          </p>
        </div>
        <a
          href={EXTENSION_INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-control border-2 border-accent-foreground px-5 font-semibold outline-none transition-colors hover:bg-accent-foreground hover:text-accent focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          Get the extension
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </div>
    );
  }

  return null;
}

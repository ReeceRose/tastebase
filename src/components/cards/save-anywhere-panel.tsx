"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ButtonVariant } from "@/lib/types";

interface Address {
  origin: string;
  secure: boolean;
}

function useAddress(): Address | null {
  const [address, setAddress] = useState<Address | null>(null);
  useEffect(() => {
    setAddress({
      origin: window.location.origin,
      secure: window.isSecureContext,
    });
  }, []);
  return address;
}

function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-control bg-muted py-1.5 pr-1.5 pl-4">
      <code className="min-w-0 flex-1 truncate text-meta">{text}</code>
      <Button
        type="button"
        size="sm"
        variant={ButtonVariant.GHOST}
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

const stepList = "list-decimal space-y-2 pl-5 marker:font-semibold";

export function SaveAnywherePanel() {
  const address = useAddress();
  const origin = address?.origin ?? "";
  const shareAddress = `${origin}/recipes/new?url=`;

  return (
    <div className="space-y-5">
      <Panel title="On your computer" subheading>
        <p className="max-w-[60ch] text-muted-foreground">
          The Save to Tastebase extension for Chrome, Edge, Brave and Arc brings
          in the recipe you're looking at, photos included. It works on sites
          that block imports and on subscriber sites you're signed in to. Ask
          whoever runs this Tastebase for it.
        </p>
      </Panel>

      <Panel title="On Android" subheading>
        <ol className={stepList}>
          <li>
            Open <strong>{origin || "Tastebase"}</strong> in Chrome on your
            phone and sign in.
          </li>
          <li>
            Tap the <strong>⋮</strong> menu, then{" "}
            <strong>Add to home screen</strong> and <strong>Install</strong>.
          </li>
          <li>
            On any recipe, in any app, tap <strong>Share</strong> and pick{" "}
            <strong>Tastebase</strong>. It opens ready to check over.
          </li>
        </ol>
        {address && !address.secure && (
          <p className="mt-4 rounded-control bg-accent px-4 py-3 text-accent-foreground">
            Android only installs apps from a secure (https) address, and this
            Tastebase is at {origin}. Reach it through something like Tailscale
            or a Cloudflare Tunnel to get one.
          </p>
        )}
      </Panel>

      <Panel title="On iPhone and iPad" subheading>
        <p className="mb-4 max-w-[60ch] text-muted-foreground">
          iOS doesn't let web apps join the share sheet, so a Shortcut does it
          instead. You set it up once.
        </p>
        <ol className={stepList}>
          <li>
            Open the <strong>Shortcuts</strong> app, tap <strong>+</strong> and
            name the shortcut <strong>Save to Tastebase</strong>.
          </li>
          <li>
            Tap the <strong>ⓘ</strong> button, turn on{" "}
            <strong>Show in Share Sheet</strong>, and set it to receive{" "}
            <strong>URLs</strong> and <strong>Safari web pages</strong>.
          </li>
          <li>
            Add the <strong>URL Encode</strong> action. It should encode{" "}
            <strong>Shortcut Input</strong>.
          </li>
          <li className="space-y-2">
            <span>
              Add the <strong>Open URLs</strong> action. Paste this address,
              then add <strong>URL Encoded Text</strong> right after it:
            </span>
            {origin && <CopyText text={shareAddress} />}
          </li>
          <li>
            On any recipe, tap <strong>Share</strong> and pick{" "}
            <strong>Save to Tastebase</strong>.
          </li>
        </ol>
      </Panel>

      <p className="max-w-[60ch] text-meta text-muted-foreground">
        On a phone, Tastebase reads the recipe from the link itself. A few sites
        block that. For those, copy the recipe text and paste it into Add a
        recipe instead.
      </p>
    </div>
  );
}

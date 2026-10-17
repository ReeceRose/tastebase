import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  wordmarkClassName?: string;
}

export function BrandMark({ className, wordmarkClassName }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-[26px] shrink-0 rounded-[50%_50%_50%_4px] bg-swatch-tomato"
      />
      <span
        className={cn(
          "text-[26px] leading-none font-extrabold tracking-[-0.03em]",
          wordmarkClassName,
        )}
      >
        Tastebase
      </span>
    </Link>
  );
}

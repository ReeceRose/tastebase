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
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="size-[26px] shrink-0 fill-swatch-tomato"
      >
        <path d="M0,50A50,50 0 0 1 50,0A50,50 0 0 1 67.57,3.19A13,13 0 0 0 82.35,19.79A15,15 0 0 0 99.12,40.67A50,50 0 0 1 50,100L14,100A14,14 0 0 1 0,86Z" />
      </svg>
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

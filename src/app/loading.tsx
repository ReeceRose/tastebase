export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <span role="status" className="flex flex-col items-center gap-4">
        <span
          aria-hidden
          className="size-10 animate-pulse rounded-[50%_50%_50%_6px] bg-swatch-tomato"
        />
        <span className="text-meta text-muted-foreground">Loading…</span>
      </span>
    </div>
  );
}

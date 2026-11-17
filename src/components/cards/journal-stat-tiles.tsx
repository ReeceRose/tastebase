import type { JournalStatTile } from "@/lib/types/journal-lookback-types";

interface JournalStatTilesProps {
  stats: JournalStatTile[];
}

export function JournalStatTiles({ stats }: JournalStatTilesProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col-reverse rounded-tile bg-card px-5 py-4"
        >
          <dt className="text-meta text-muted-foreground">{stat.label}</dt>
          <dd className="text-title leading-none tabular">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

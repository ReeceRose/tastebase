import {
  RefreshChangeKind,
  type RefreshFieldChange,
  type RefreshLineChange,
} from "@/lib/types/recipe-refresh-types";

interface RefreshFieldListProps {
  changes: RefreshFieldChange[];
}

export function RefreshFieldList({ changes }: RefreshFieldListProps) {
  return (
    <dl className="space-y-1.5 text-sm">
      {changes.map((change) => (
        <div key={change.label} className="grid grid-cols-[110px_1fr] gap-3">
          <dt className="text-muted-foreground">{change.label}</dt>
          <dd className="min-w-0">
            {change.before !== null && (
              <span className="text-muted-foreground line-through">
                {change.before}
              </span>
            )}
            {change.before !== null && change.after !== null && " → "}
            {change.after !== null ? (
              <span className="font-semibold">{change.after}</span>
            ) : (
              <span className="text-muted-foreground"> removed</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface RefreshLineListProps {
  changes: RefreshLineChange[];
}

const KIND_LABELS: Record<RefreshChangeKind, string> = {
  [RefreshChangeKind.ADDED]: "New",
  [RefreshChangeKind.REMOVED]: "Gone",
  [RefreshChangeKind.CHANGED]: "Changed",
};

export function RefreshLineList({ changes }: RefreshLineListProps) {
  return (
    <ul className="space-y-2 text-sm">
      {changes.map((change) => (
        <li
          key={`refresh-line-${change.id}`}
          className="grid grid-cols-[64px_1fr] gap-3"
        >
          <span className="text-caption font-semibold text-muted-foreground uppercase">
            {KIND_LABELS[change.kind]}
          </span>
          <div className="min-w-0 space-y-0.5">
            {change.before && (
              <p
                className={
                  change.kind === RefreshChangeKind.REMOVED ||
                  change.kind === RefreshChangeKind.CHANGED
                    ? "text-muted-foreground line-through"
                    : undefined
                }
              >
                {change.before}
              </p>
            )}
            {change.after && <p className="font-semibold">{change.after}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

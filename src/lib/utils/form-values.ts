// For number inputs registered with setValueAs. react-hook-form also passes
// the default value through here, so null has to stay null rather than become
// Number(null), which is 0.
export function numberOrNull(value: string | number | null): number | null {
  return value === "" || value === null ? null : Number(value);
}

/**
 * Origin allow-list for state-changing requests.
 * Pure (no server-only, no env reads) so route handlers and unit tests share it.
 *
 * An empty allow-list does not enforce. When the list is non-empty, a missing
 * Origin and an Origin that is not on the list are both forbidden.
 */
export function originBlock(
  origin: string | null | undefined,
  allowed: readonly string[],
): "forbidden_origin" | null {
  if (allowed.length === 0) return null;
  if (origin == null || origin === "" || !allowed.includes(origin)) return "forbidden_origin";
  return null;
}

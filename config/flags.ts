/**
 * Product flags. Keep signup counts off the page (`SHOW_WAITLIST_TOTAL`).
 * Copy keys tagged with a flag in `lib/copy/key-flags.json` must not render while it is false.
 */
export const FLAGS = {
  SHOW_WAITLIST_TOTAL: false,
} as const;

export type FlagName = keyof typeof FLAGS;

export function isFlagOn(name: string): boolean {
  if (!Object.prototype.hasOwnProperty.call(FLAGS, name)) return false;
  const value: boolean = FLAGS[name as FlagName];
  return value;
}

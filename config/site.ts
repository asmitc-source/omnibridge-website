export const BRAND = { name: "OmniBridge" } as const;

/** Decided term. Deck strings already include it; this is the single constant. */
export const SIGNED_RECORD_TERM = "tamper-evident" as const;

export const FLAGS = {
  SHOW_WAITLIST_TOTAL: false,
} as const;

export type FlagName = keyof typeof FLAGS;

export function isFlagOn(name: string): boolean {
  if (!Object.prototype.hasOwnProperty.call(FLAGS, name)) return false;
  const value: boolean = FLAGS[name as FlagName];
  return value;
}

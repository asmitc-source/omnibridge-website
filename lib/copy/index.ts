import { BRAND } from "@/config/site";
import dictionary from "./site.copy.json";

export type CopyKey = keyof typeof dictionary;

const COPY = dictionary as Record<CopyKey, string>;

/** Fills `{brand}`, `{year}`, and any extra single-brace tokens. Leaves `{{tag}}` alone. */
export function copy(key: CopyKey, vars: Record<string, string | number> = {}): string {
  const values: Record<string, string> = {
    brand: BRAND.name,
    year: String(new Date().getFullYear()),
  };
  for (const [name, value] of Object.entries(vars)) values[name] = String(value);
  return COPY[key].replace(/\{(\w+)\}/g, (match, name: string, offset: number, full: string) => {
    if (full[offset - 1] === "{" || full[offset + match.length] === "}") return match;
    return Object.prototype.hasOwnProperty.call(values, name) ? values[name]! : match;
  });
}

export function copyMaybe(key: string, vars?: Record<string, string | number>): string | null {
  if (!Object.prototype.hasOwnProperty.call(COPY, key)) return null;
  return copy(key as CopyKey, vars);
}

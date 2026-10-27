import { BRAND } from "@/config/site";

/**
 * Replaces a single-brace `{brand}` token with `BRAND.name`.
 * Double-brace `{{brand}}` (email merge tags) is left unchanged.
 */
export function interpolateBrand(template: string): string {
  return template.replace(/(?<!\{)\{brand\}(?!\})/g, BRAND.name);
}

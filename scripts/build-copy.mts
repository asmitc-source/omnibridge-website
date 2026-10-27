/**
 * Flattens the approved copy deck into lib/copy/site.copy.json (flat key -> string).
 * Refuses to invent keys when the deck is not on disk.
 *
 *   node --experimental-strip-types scripts/build-copy.mts [path/to/copy-deck.md]
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const candidates = [process.argv[2], process.env.COPY_DECK, "uploads/copy-deck-v1.2.md"].filter(
  (value): value is string => typeof value === "string" && value.length > 0,
);

const found = candidates.map((path) => resolve(path)).find((path) => existsSync(path));

if (!found) {
  console.error("build-copy: copy deck not found. Refusing to invent keys.");
  console.error("Pass the deck path, or set COPY_DECK. Looked for:");
  for (const path of candidates) console.error(`  - ${path}`);
  process.exit(1);
}

console.error(`build-copy: found ${found}`);
console.error("build-copy: deck parser is not enabled until the approved deck is in the workspace.");
process.exit(1);

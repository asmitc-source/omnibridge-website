/**
 * Flattens the approved copy deck into lib/copy/site.copy.json and
 * lib/copy/demo.script.json. Refuses to invent keys.
 *
 *   node --experimental-strip-types scripts/build-copy.mts [path/to/copy-deck.md]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const candidates = [process.argv[2], process.env.COPY_DECK, "uploads/copy-deck-v1.2.md"].filter(
  (value): value is string => typeof value === "string" && value.length > 0,
);

const found = candidates.map((path) => resolve(path)).find((path) => existsSync(path));
if (!found) {
  console.error("build-copy: copy deck not found. Refusing to invent keys.");
  for (const path of candidates) console.error(`  - ${path}`);
  process.exit(1);
}

const text = readFileSync(found, "utf8");
const blocks = [...text.matchAll(/```json\n([\s\S]*?)```/g)].map((match) => JSON.parse(match[1]) as unknown);

const demo = blocks.find(
  (block): block is { steps: unknown[] } =>
    Boolean(block) && typeof block === "object" && block !== null && "steps" in block,
);
const dictionary = blocks.find(
  (block): block is Record<string, string> =>
    Boolean(block) &&
    typeof block === "object" &&
    block !== null &&
    !Array.isArray(block) &&
    "nav.wordmark" in block,
);

if (!demo || !dictionary) {
  console.error("build-copy: expected the demo JSON block and the Appendix A map.");
  process.exit(1);
}

for (const [key, value] of Object.entries(dictionary)) {
  if (typeof value !== "string") {
    console.error(`build-copy: ${key} is not a string`);
    process.exit(1);
  }
  if (key.includes("note") || key.includes("internal")) {
    console.error(`build-copy: key contains note or internal: ${key}`);
    process.exit(1);
  }
}

const flags: Record<string, string> = {
  "form.success.total": "SHOW_WAITLIST_TOTAL",
  "referral.rule.excluded": "SHOW_WAITLIST_TOTAL",
};

const outDir = resolve("lib/copy");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "site.copy.json"), `${JSON.stringify(dictionary, null, 2)}\n`);
writeFileSync(resolve(outDir, "demo.script.json"), `${JSON.stringify(demo, null, 2)}\n`);
writeFileSync(resolve(outDir, "key-flags.json"), `${JSON.stringify(flags, null, 2)}\n`);
console.log(
  `build-copy: ${Object.keys(dictionary).length} keys, ${demo.steps.length} demo steps, from ${found}`,
);
void dirname;

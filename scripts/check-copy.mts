/**
 * Rendered-copy gate.
 * Fails when a rendered key is missing, contains "note" or "internal",
 * or is tagged with a flag that is off. Scans app, components, lib, emails,
 * and config. The brand name may appear only in config/site.ts and the
 * changelog. demo.label.fictional must exist and
 * render once, under the first company chip.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-ext.mjs scripts/check-copy.mts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { BRAND } from "../config/site.ts";
import { isFlagOn } from "../config/flags.ts";

const ROOT = process.cwd();
const DICTIONARY = join(ROOT, "lib/copy/site.copy.json");
const KEY_FLAGS = join(ROOT, "lib/copy/key-flags.json");
const SCAN_ROOTS = ["app", "components", "lib", "emails", "config"];
const RENDER_ROOTS = ["app", "components"];
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json"]);
const FICTIONAL_KEY = "demo.label.fictional";

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try {
    fn();
    results.push(`PASS ${name}`);
  } catch (error) {
    results.push(`FAIL ${name}: ${(error as Error).message}`);
  }
};

function stripComments(src: string): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      out += " ";
      continue;
    }
    const quote = src[i];
    if (quote === '"' || quote === "'" || quote === "`") {
      out += quote;
      i += 1;
      while (i < src.length) {
        if (src[i] === "\\") {
          out += src[i] + (src[i + 1] ?? "");
          i += 2;
          continue;
        }
        out += src[i];
        if (src[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (src.startsWith("//", i)) {
      const end = src.indexOf("\n", i);
      i = end === -1 ? src.length : end;
      continue;
    }
    out += src[i];
    i += 1;
  }
  return out;
}

function isExemptBrandPath(path: string): boolean {
  const normalised = path.replaceAll("\\", "/");
  if (normalised === "config/site.ts") return true;
  return /(?:^|\/)CHANGELOG(?:\.md)?$/i.test(normalised);
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

function filesUnder(roots: string[]): string[] {
  const out: string[] = [];
  for (const root of roots) {
    for (const path of walk(join(ROOT, root))) {
      const ext = path.slice(path.lastIndexOf("."));
      if (CODE_EXT.has(ext)) out.push(path);
    }
  }
  return out;
}

function brandHits(path: string, source: string): boolean {
  if (isExemptBrandPath(path)) return false;
  const code = path.endsWith(".json") ? source : stripComments(source);
  return code.includes(BRAND.name);
}

function renderedKeys(source: string): string[] {
  const keys: string[] = [];
  const pattern = /\bcopy\(\s*(['"`])([^'"`]+)\1/g;
  for (const match of stripComments(source).matchAll(pattern)) {
    const key = match[1] === "`" && match[2].includes("${") ? "" : match[2];
    if (key) keys.push(key);
  }
  return keys;
}

function loadStringMap(path: string): Record<string, string> | null {
  if (!existsSync(path)) return null;
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${relative(ROOT, path)} must be a flat object`);
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string") throw new Error(`${key} must be a string`);
    out[key] = value;
  }
  return out;
}

function fictionalUnderFirstChip(source: string): boolean {
  const call = source.search(/copy\(\s*(['"])demo\.label\.fictional\1/);
  if (call === -1) return false;
  const before = source.slice(0, call);
  const chip = before.search(/data-company-chip=(?:"1"|'1'|\{1\})/);
  if (chip !== -1) {
    const between = before.slice(chip);
    return !/data-company-chip=(?:"[2-9]"|'[2-9]'|\{[2-9]\})/.test(between);
  }
  const window = source.slice(Math.max(0, call - 600), call + 120);
  return /data-company-chip/.test(source) && /(?:\bindex|\bi|\bchip)\s*===\s*0\b/.test(window);
}

check("brand name stays in config/site.ts and the changelog", () => {
  const hits = filesUnder(SCAN_ROOTS)
    .map((path) => relative(ROOT, path))
    .filter((path) => brandHits(path, readFileSync(join(ROOT, path), "utf8")))
    .sort();
  assert.deepEqual(hits, []);
});

check("changelog and comments are not brand hits", () => {
  const sample = `name ${BRAND.name}`;
  assert.equal(brandHits("CHANGELOG.md", sample), false);
  assert.equal(brandHits("docs/CHANGELOG.md", sample), false);
  assert.equal(brandHits("config/site.ts", sample), false);
  assert.equal(brandHits("app/page.tsx", sample), true);
  const commented = `// ${BRAND.name}\n/* ${BRAND.name} */\nexport const ok = 1;\n`;
  assert.equal(brandHits("app/example.tsx", commented), false);
});

let dictionary: Record<string, string> | null = null;
check("site copy dictionary exists and is a string map", () => {
  dictionary = loadStringMap(DICTIONARY);
  assert.ok(dictionary, "lib/copy/site.copy.json is missing. Run build-copy against the approved deck.");
});

let flags: Record<string, string> = {};
check("copy key flags are a string map when present", () => {
  if (!existsSync(KEY_FLAGS)) return;
  const loaded = loadStringMap(KEY_FLAGS);
  assert.ok(loaded);
  flags = loaded;
});

const renders = new Map<string, string[]>();
for (const path of filesUnder(RENDER_ROOTS)) {
  const rel = relative(ROOT, path);
  const source = readFileSync(path, "utf8");
  for (const key of renderedKeys(source)) {
    const list = renders.get(key) ?? [];
    list.push(rel);
    renders.set(key, list);
  }
}

check("every rendered key exists", () => {
  assert.ok(dictionary, "dictionary missing");
  const missing = [...renders.keys()].filter((key) => !(key in dictionary!)).sort();
  assert.deepEqual(missing, []);
});

check("rendered keys do not contain note or internal", () => {
  const bad = [...renders.keys()].filter((key) => key.includes("note") || key.includes("internal")).sort();
  assert.deepEqual(bad, []);
});

check("flagged-hidden keys stay unrendered while the flag is off", () => {
  const shown = Object.entries(flags)
    .filter(([key, flag]) => !isFlagOn(flag) && renders.has(key))
    .map(([key, flag]) => `${key} (${flag})`)
    .sort();
  assert.deepEqual(shown, []);
});

check("demo.label.fictional exists and renders once under the first company chip", () => {
  assert.ok(dictionary, "dictionary missing");
  assert.equal(dictionary![FICTIONAL_KEY] !== undefined, true, `${FICTIONAL_KEY} missing from dictionary`);
  const places = renders.get(FICTIONAL_KEY) ?? [];
  assert.equal(places.length, 1, `rendered ${places.length} times (${places.join(", ")})`);
  const source = readFileSync(join(ROOT, places[0]!), "utf8");
  assert.equal(fictionalUnderFirstChip(source), true, "not under the first company chip");
});

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exit(1);

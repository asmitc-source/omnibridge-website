/**
 * Fails if alert colour appears outside RedAlertModal, KillSwitchButton,
 * PausePulse, tokens.json, and the generated theme CSS (app/tokens.generated.css).
 * motion/tokens.ts is not exempt.
 *
 *   node --experimental-strip-types scripts/check-red.mts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const PATTERN =
  /alert-red|ff3b4e|ef4444|on-red|alert-veil|alert-vignette|glow\.alert|killSwitchRed|255,\s*59,\s*78|239,\s*68,\s*68|\b(?:red|rose)-(?:50|[1-9]00|950)\b/i;

const ALLOWED_FILE =
  /(?:^|\/)(?:RedAlertModal|KillSwitchButton|PausePulse)(?:\.[^/]+)*$/;

const SOURCE_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".css",
  ".json",
  ".svg",
  ".html",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  "coverage",
  "uploads",
  "dist",
  "build",
]);

const ROOT = process.cwd();

function isAllowedPath(path: string): boolean {
  const normalised = path.split(sep).join("/");
  if (normalised.endsWith("scripts/check-red.mts")) return true;
  if (normalised === "tokens.json" || normalised.endsWith("/tokens.json")) return true;
  if (normalised === "app/tokens.generated.css") return true;
  return ALLOWED_FILE.test(normalised);
}

function stripReservedValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripReservedValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key.toLowerCase() === "reserved") continue;
      out[key] = stripReservedValue(child);
    }
    return out;
  }
  return value;
}

function stripReservedJson(text: string): string {
  try {
    return JSON.stringify(stripReservedValue(JSON.parse(text)));
  } catch {
    return text;
  }
}

function stripReservedCss(text: string): string {
  const withoutBlocks = text.replace(/\/\*\s*reserved:start\s*\*\/[\s\S]*?\/\*\s*reserved:end\s*\*\//gi, "");
  return withoutBlocks
    .split("\n")
    .filter((line, index, lines) => {
      if (/\/\*\s*reserved\s*\*\//i.test(line)) return false;
      const previous = lines[index - 1] ?? "";
      return !/\/\*\s*reserved\s*\*\//i.test(previous);
    })
    .join("\n");
}

function textForScan(path: string, text: string): string {
  if (path.endsWith(".json")) return stripReservedJson(text);
  if (path.endsWith(".css")) return stripReservedCss(text);
  return text;
}

function walk(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (st.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

function selfTest(): void {
  const hidden = '{"reserved":{"swatch":"ff3b4e"},"ink":"#111111"}';
  assert.equal(PATTERN.test(stripReservedJson(hidden)), false);
  const visible = '{"ink":"#ef4444"}';
  assert.equal(PATTERN.test(stripReservedJson(visible)), true);
  assert.equal(PATTERN.test("text-red-500"), true);
  assert.equal(PATTERN.test("text-rose-50"), true);
  assert.equal(PATTERN.test("prefers-reduced-motion"), false);
  assert.equal(isAllowedPath("components/demo/RedAlertModal.tsx"), true);
  assert.equal(isAllowedPath("components/demo/KillSwitchButton.tsx"), true);
  assert.equal(isAllowedPath("components/demo/PausePulse.ts"), true);
  assert.equal(isAllowedPath("components/hero/Hero.tsx"), false);
  assert.equal(isAllowedPath("tokens.json"), true);
  assert.equal(isAllowedPath("app/tokens.generated.css"), true);
  assert.equal(isAllowedPath("motion/tokens.ts"), false);
  const css = "/* reserved:start */\ncolor: #ff3b4e;\n/* reserved:end */\ncolor: #111;";
  assert.equal(PATTERN.test(stripReservedCss(css)), false);
  const flagged = "/* reserved */\ncolor: #ef4444;\ncolor: #111;";
  assert.equal(PATTERN.test(stripReservedCss(flagged)), false);
}

function scanRepo(): string[] {
  const hits: string[] = [];
  for (const path of walk(ROOT)) {
    const rel = relative(ROOT, path);
    if (isAllowedPath(rel)) continue;
    const ext = rel.includes(".") ? rel.slice(rel.lastIndexOf(".")) : "";
    if (!SOURCE_EXT.has(ext)) continue;
    if (rel === "package-lock.json") continue;
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    if (raw.includes("\0")) continue;
    const text = textForScan(rel, raw);
    if (PATTERN.test(text)) hits.push(rel);
  }
  return hits.sort();
}

selfTest();
const hits = scanRepo();
if (hits.length > 0) {
  console.error("check:red failed. Alert colour outside RedAlertModal, KillSwitchButton, PausePulse:");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log("PASS check:red");

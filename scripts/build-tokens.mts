/**
 * Generates app/tokens.generated.css and motion/tokens.ts from tokens.json.
 * Reserved colours stay in the CSS file (check:red exempt) and are omitted
 * from motion/tokens.ts.
 *
 *   node --experimental-strip-types scripts/build-tokens.mts
 *   node --experimental-strip-types scripts/build-tokens.mts --check
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type TokenFile = {
  color: Record<string, { value: string; reserved?: boolean }>;
  gradient: Record<string, string>;
  glow: Record<string, string | { strength: number; radius: number; threshold: number; luminanceSmoothing: number }>;
  font: Record<string, { family: string }>;
  type: Record<string, { size?: string; lh?: number; tracking?: string; weight?: number; family?: string; transform?: string; features?: string }>;
  space: Record<string, string>;
  radius: Record<string, string>;
  motion: {
    duration: Record<string, number>;
    ease: Record<string, { css?: string }>;
  };
  focus: { ring: string };
};

const RED = new RegExp(
  [
    "alert-" + "red",
    "ff3b" + "4e",
    "ef44" + "44",
    "on-" + "red",
    "alert-" + "veil",
    "alert-" + "vignette",
    "glow." + "alert",
    "killSwitch" + "Red",
    "255," + "\\s*59," + "\\s*78",
    "239," + "\\s*68," + "\\s*68",
    "\\b(?:" + "red|rose" + ")-(?:50|[1-9]00|950)\\b",
  ].join("|"),
  "i",
);

const tokens = JSON.parse(readFileSync(resolve("tokens.json"), "utf8")) as TokenFile;

const css: string[] = [
  "/* Generated from tokens.json. Do not edit by hand. */",
  "@theme {",
  "  --color-*: initial;",
];

for (const [name, token] of Object.entries(tokens.color)) {
  css.push(`  --color-${name}: ${token.value};`);
}

for (const [name, value] of Object.entries(tokens.gradient)) {
  css.push(`  --gradient-${name}: ${value};`);
}

for (const [name, value] of Object.entries(tokens.glow)) {
  if (typeof value === "string") css.push(`  --glow-${name}: ${value};`);
}

css.push(`  --font-display: var(--font-space-grotesk), Arial, sans-serif;`);
css.push(`  --font-body: var(--font-inter), Arial, sans-serif;`);
css.push(`  --font-mono: var(--font-jetbrains), ui-monospace, monospace;`);

for (const [name, step] of Object.entries(tokens.type)) {
  if (!step.size) continue;
  css.push(`  --text-${name}: ${step.size};`);
  if (step.lh) css.push(`  --text-${name}--line-height: ${step.lh};`);
  if (step.tracking) css.push(`  --text-${name}--letter-spacing: ${step.tracking};`);
  if (step.weight) css.push(`  --text-${name}--font-weight: ${step.weight};`);
}

for (const [name, value] of Object.entries(tokens.space)) {
  css.push(`  --spacing-${name}: ${value};`);
}

for (const [name, value] of Object.entries(tokens.radius)) {
  css.push(`  --radius-${name}: ${value};`);
}

for (const [name, ease] of Object.entries(tokens.motion.ease)) {
  if (ease.css) css.push(`  --ease-${name}: ${ease.css};`);
}

for (const [name, seconds] of Object.entries(tokens.motion.duration)) {
  css.push(`  --duration-${name}: ${seconds}s;`);
}

css.push(`  --shadow-focus: ${tokens.focus.ring};`);
css.push("}");
css.push("");

for (const [name, step] of Object.entries(tokens.type)) {
  if (!step.size) continue;
  const family = step.family === "mono" ? "var(--font-mono)" : step.family === "display" ? "var(--font-display)" : "var(--font-body)";
  const transform = step.transform ? `  text-transform: ${step.transform};` : "";
  const features = step.features ? `  font-feature-settings: ${step.features.split(",").map((f) => `"${f.trim()}"`).join(", ")};` : "";
  css.push(`@utility type-${name} {`);
  css.push(`  font-family: ${family};`);
  css.push(`  font-size: var(--text-${name});`);
  css.push(`  line-height: var(--text-${name}--line-height, normal);`);
  css.push(`  letter-spacing: var(--text-${name}--letter-spacing, normal);`);
  css.push(`  font-weight: var(--text-${name}--font-weight, 400);`);
  if (transform) css.push(transform);
  if (features) css.push(features);
  css.push("}");
  css.push("");
}

const cssText = `${css.join("\n")}\n`;

const motionColors: Record<string, string> = {};
const named: Record<string, string> = {
  bg: "navy",
  surface: "navyRaised",
  cyan: "cyan",
  violet: "violet",
  line: "line",
  "text-1": "foreground",
  "cyan-300": "cyan300",
  success: "success",
};
for (const [name, token] of Object.entries(tokens.color)) {
  if (token.reserved) continue;
  if (RED.test(token.value) || RED.test(name)) continue;
  const key = named[name];
  if (key) motionColors[key] = token.value;
}

const motion = {
  color: motionColors,
  duration: tokens.motion.duration,
  ease: Object.fromEntries(
    Object.entries(tokens.motion.ease)
      .filter(([, ease]) => ease.css && !RED.test(ease.css))
      .map(([name, ease]) => [name, ease.css]),
  ),
};

const motionText = `/* Generated from tokens.json. Reserved colours are omitted. Do not edit by hand. */\nexport const motionTokens = ${JSON.stringify(motion, null, 2)} as const;\n`;

if (RED.test(motionText)) {
  console.error("build-tokens: motion/tokens.ts would contain a reserved colour");
  process.exit(1);
}

const cssPath = resolve("app/tokens.generated.css");
const motionPath = resolve("motion/tokens.ts");
const check = process.argv.includes("--check");

if (check) {
  const cssSame = readFileSync(cssPath, "utf8") === cssText;
  const motionSame = readFileSync(motionPath, "utf8") === motionText;
  if (!cssSame || !motionSame) {
    console.error("build-tokens: generated files drifted from tokens.json");
    process.exit(1);
  }
  console.log("PASS check:tokens");
} else {
  writeFileSync(cssPath, cssText);
  writeFileSync(motionPath, motionText);
  console.log("build-tokens: wrote app/tokens.generated.css and motion/tokens.ts");
}

/**
 * Keys the site actually passes to copy(). The dictionary may contain only these.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SCAN = ["app", "components", "lib/seo.ts"];

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (path.endsWith(".ts") || path.endsWith(".tsx")) out.push(path);
  }
  return out;
}

export function collectRenderedKeys(root: string, universe: ReadonlySet<string>): Set<string> {
  const files = SCAN.flatMap((entry) => {
    const path = join(root, entry);
    if (!existsSync(path)) return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
  const sources = files.map((file) => readFileSync(file, "utf8"));
  const pageIds = new Set<string>();
  for (const src of sources) {
    for (const match of src.matchAll(/pageMetadata\(\s*["']([A-Za-z0-9_]+)["']/g)) pageIds.add(match[1]);
  }
  const rendered = new Set<string>();
  for (const src of sources) {
    for (const key of universe) {
      if (src.includes(`"${key}"`) || src.includes(`'${key}'`) || src.includes("`" + key + "`")) rendered.add(key);
    }
    const numbers = new Set<string>();
    for (const match of src.matchAll(/\[((?:\d+\s*,\s*)+\d+)\]/g)) {
      for (const part of match[1].split(",")) numbers.add(part.trim());
    }
    for (const match of src.matchAll(/`([^`]*\$\{(?:n|page)\}[^`]*)`/g)) {
      const template = match[1];
      if (template.includes("${n}")) {
        const [pre, post] = template.split("${n}");
        for (const n of numbers) {
          const key = `${pre ?? ""}${n}${post ?? ""}`;
          if (universe.has(key)) rendered.add(key);
        }
      }
      if (template.includes("${page}")) {
        const [pre, post] = template.split("${page}");
        for (const id of pageIds) {
          const key = `${pre ?? ""}${id}${post ?? ""}`;
          if (universe.has(key)) rendered.add(key);
        }
      }
    }
  }
  return rendered;
}

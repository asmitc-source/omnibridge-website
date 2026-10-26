// Unit test for the Origin allow-list. Pure, no env needed:
//   node --experimental-strip-types scripts/origin-check.mts
import assert from "node:assert/strict";
import { originBlock } from "../lib/origin.ts";

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try { fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${(e as Error).message}`); }
};

const allowed = ["https://preview.example"];

check("missing Origin with list set -> 403 forbidden_origin", () => {
  assert.equal(originBlock(null, allowed), "forbidden_origin");
  assert.equal(originBlock(undefined, allowed), "forbidden_origin");
  assert.equal(originBlock("", allowed), "forbidden_origin");
});

check("missing Origin with empty list -> allowed", () => {
  assert.equal(originBlock(null, []), null);
  assert.equal(originBlock(undefined, []), null);
  assert.equal(originBlock("", []), null);
});

check("allowed Origin -> allowed", () => {
  assert.equal(originBlock("https://preview.example", allowed), null);
});

check("foreign Origin with list set -> 403 forbidden_origin", () => {
  assert.equal(originBlock("https://evil.example", allowed), "forbidden_origin");
});

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);

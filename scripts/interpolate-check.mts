import assert from "node:assert/strict";
import { BRAND } from "../config/site.ts";
import { interpolateBrand } from "../lib/copy/interpolate.ts";

const name = BRAND.name;

assert.equal(interpolateBrand(`Hello {brand}`), `Hello ${name}`);
assert.equal(interpolateBrand(`{brand} / {brand}`), `${name} / ${name}`);
assert.equal(interpolateBrand("The {{brand}} team"), "The {{brand}} team");
assert.equal(interpolateBrand("{BRAND}"), "{BRAND}");
assert.equal(interpolateBrand("{brandname}"), "{brandname}");
assert.equal(interpolateBrand("no token"), "no token");
assert.equal(interpolateBrand(""), "");

console.log("PASS interpolateBrand");

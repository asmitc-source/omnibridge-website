// Product name and confirmation-email send gate. Pure, no env needed:
//   node --experimental-strip-types scripts/brand-copy-check.mts
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { BRAND } from "../config/site.ts";
import {
  EMAIL_CONFIRM_COPY,
  emailCopy,
  emailCopyBlockers,
  type EmailConfirmKey,
  type EmailMergeVars,
} from "../lib/copy/emailConfirm.ts";

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try { fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${(e as Error).message}`); }
};

const VARS: EmailMergeVars = {
  position: 42,
  share_url: "https://example.com/?ref=abcd2345",
  site_url: "https://example.com",
  privacy_url: "https://example.com/privacy",
  unsubscribe_url: "https://example.com/unsubscribe",
};

/** Drop comments. String and template literals are kept so a hardcoded name still fails. */
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

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

check("no runtime string contains OmniBridge outside config/site.ts", () => {
  const roots = ["lib", "emails", "app", "config"];
  const hits: string[] = [];
  for (const root of roots) {
    for (const file of sourceFiles(root)) {
      const code = stripComments(readFileSync(file, "utf8"));
      if (code.includes("OmniBridge")) hits.push(file);
    }
  }
  hits.sort();
  assert.deepEqual(hits, ["config/site.ts"]);
});

check("current copy blockers include footer.entity", () => {
  const blockers = emailCopyBlockers(VARS);
  assert.ok(blockers.includes("email.confirm.footer.entity"), blockers.join(","));
});

function blockersFor(text: string): string[] {
  return emailCopyBlockers(VARS, { sample: text });
}

check("[REGISTERED ADDRESS] makes emailCopyBlockers non-empty", () => {
  assert.ok(blockersFor("Acme · [REGISTERED ADDRESS] · hello@example.com").length > 0);
});

check("[domain] makes emailCopyBlockers non-empty", () => {
  assert.ok(blockersFor("hello@[domain]").length > 0);
});

check("{brand} makes emailCopyBlockers non-empty", () => {
  assert.ok(blockersFor("The {brand} team").length > 0);
  assert.ok(blockersFor("The {BRAND} team").length > 0);
});

check("{{brand}} makes emailCopyBlockers non-empty", () => {
  assert.ok(blockersFor("The {{brand}} team").length > 0);
  assert.ok(blockersFor("The {{BRAND}} team").length > 0);
});

check("a fully resolved copy yields no blockers", () => {
  const resolved = {
    "email.confirm.subject": `You're #42 on the ${BRAND.name} waitlist`,
    "email.confirm.signoff": `The ${BRAND.name} team`,
    "email.confirm.footer.entity": "Example Ltd · 1 Market Street, London · hello@example.com",
    "email.confirm.footer.reason": `You're getting this because you joined the ${BRAND.name} waitlist at https://example.com.`,
  };
  assert.deepEqual(emailCopyBlockers(VARS, resolved), []);
});

check("sign-off renders The OmniBridge team and footer stays the placeholder line", () => {
  assert.equal(EMAIL_CONFIRM_COPY["email.confirm.signoff"], "The {{brand}} team");
  assert.equal(EMAIL_CONFIRM_COPY["email.confirm.signoff"].includes(BRAND.name), false);
  assert.equal(emailCopy("email.confirm.signoff", VARS), `The ${BRAND.name} team`);
  assert.equal(emailCopy("email.confirm.subject", VARS), `You're #42 on the ${BRAND.name} waitlist`);
  assert.equal(emailCopy("email.confirm.p1", VARS), `You're on the ${BRAND.name} waitlist. Your spot is #42.`);
  assert.equal(
    emailCopy("email.confirm.footer.reason", VARS),
    `You're getting this because you joined the ${BRAND.name} waitlist at https://example.com.`,
  );
  assert.equal(
    emailCopy("email.confirm.footer.entity", VARS),
    "[LEGAL ENTITY] · [REGISTERED ADDRESS] · hello@[domain]",
  );
  const rendered = (Object.keys(EMAIL_CONFIRM_COPY) as EmailConfirmKey[])
    .map((key) => emailCopy(key, VARS))
    .join("\n");
  assert.equal(rendered.includes("founder"), false);
  assert.equal(/\b(Claire|Asmit)\b/.test(rendered), false);
});

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);

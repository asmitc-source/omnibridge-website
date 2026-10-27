/**
 * Confirmation email copy. Source of truth was the OmniBridge copy deck v1.1,
 * section C3.3 / Appendix A. The footer line follows Claire's 2026-10-27
 * decision and no longer matches that deck verbatim. Copy needs to re-sync
 * the deck before this file is treated as verbatim again.
 *
 * The product name is PRODUCT_NAME from lib/brand.ts. fillMergeTags fills
 * {{product}} itself; callers do not pass it.
 *
 * Merge tags (double braces): {{product}}, {{position}}, {{share_url}},
 * {{site_url}}, {{privacy_url}}, {{unsubscribe_url}}.
 *
 * NOTE: `email.confirm.footer.entity` is
 * "[LEGAL ENTITY] · [REGISTERED ADDRESS] · hello@[domain]".
 * lib/confirmationEmail.ts refuses to send while any placeholder remains
 * (see emailCopyBlockers below). Email stays off (WAITLIST_EMAIL_ENABLED=false).
 */
import { PRODUCT_NAME } from "../brand";

export const EMAIL_CONFIRM_COPY = {
  "email.confirm.from_name": "{{product}}",
  "email.confirm.subject": "You're #{{position}} on the {{product}} waitlist",
  "email.confirm.preheader": "Your spot and your referral link are inside.",
  "email.confirm.greeting": "Hi there,",
  "email.confirm.p1": "You're on the {{product}} waitlist. Your spot is #{{position}}.",
  "email.confirm.p2":
    "{{product}} is being built as a neutral network where companies' AI agents will find each other, negotiate and close deals. Humans stay in control. We're starting with procurement.",
  "email.confirm.next.h": "What happens next",
  "email.confirm.next.1": "We will open early access in small groups.",
  "email.confirm.next.2": "We will email you when your spot comes up.",
  "email.confirm.next.3": "There is nothing to set up yet.",
  "email.confirm.refer.h": "Want to move up?",
  "email.confirm.refer.p1": "Each verified referral moves you up 5 spots, capped at #1.",
  "email.confirm.refer.p2": "Your link: {{share_url}}",
  "email.confirm.button": "Share your link",
  "email.confirm.signoff": "The {{product}} team",
  "email.confirm.footer.reason": "You're getting this because you joined the {{product}} waitlist at {{site_url}}.",
  "email.confirm.footer.links": "Unsubscribe: {{unsubscribe_url}} · Privacy: {{privacy_url}}",
  "email.confirm.footer.entity": "[LEGAL ENTITY] · [REGISTERED ADDRESS] · hello@[domain]",
} as const;

export type EmailConfirmKey = keyof typeof EMAIL_CONFIRM_COPY;

export type EmailMergeVars = {
  position: number;
  share_url: string;
  site_url: string;
  privacy_url: string;
  unsubscribe_url: string;
};

/** Fills {{tag}} merge tags. {{product}} comes from PRODUCT_NAME. Unknown tags are left untouched. */
export function fillMergeTags(template: string, vars: EmailMergeVars): string {
  const values: Record<string, string> = {
    product: PRODUCT_NAME,
    position: String(vars.position),
    share_url: vars.share_url,
    site_url: vars.site_url,
    privacy_url: vars.privacy_url,
    unsubscribe_url: vars.unsubscribe_url,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

export function emailCopy(key: EmailConfirmKey, vars: EmailMergeVars): string {
  return fillMergeTags(EMAIL_CONFIRM_COPY[key], vars);
}

const PLACEHOLDER_PATTERNS = [
  /\[LEGAL ENTITY\]/,
  /\[REGISTERED ADDRESS\]/,
  /@\[domain\]/,
  /\[PLACEHOLDER/i,
  /omnibridge\.example/i,
  /TODO\(copy\)/,
  /\{\{\w+\}\}/,
];

/**
 * Lists copy keys whose rendered text still contains placeholders.
 * Pass `copy` to try a replacement (tests). Empty array = ready to send.
 */
export function emailCopyBlockers(
  vars: EmailMergeVars,
  copy: { readonly [key: string]: string } = EMAIL_CONFIRM_COPY,
): string[] {
  return Object.keys(copy).filter((key) =>
    PLACEHOLDER_PATTERNS.some((re) => re.test(fillMergeTags(copy[key], vars))),
  );
}

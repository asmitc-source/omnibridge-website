/**
 * Confirmation email copy. Source of truth: OmniBridge copy deck v1.1,
 * section C3.3 / Appendix A (/workspace/omnibridge/copy/omnibridge-copy-deck-v1.1.md).
 * Strings are VERBATIM from the deck. Do not edit here; change the deck and re-sync.
 *
 * Merge tags (double braces): {{position}}, {{share_url}}, {{site_url}},
 * {{privacy_url}}, {{unsubscribe_url}}.
 *
 * NOTE: `email.confirm.footer.entity` still carries the deck's own placeholders
 * ("[LEGAL ENTITY]", "hello@omnibridge.example"). lib/confirmationEmail.ts refuses
 * to send while any placeholder remains (see emailCopyBlockers below).
 */
export const EMAIL_CONFIRM_COPY = {
  "email.confirm.from_name": "OmniBridge",
  "email.confirm.subject": "You're #{{position}} on the OmniBridge waitlist",
  "email.confirm.preheader": "Your spot and your referral link are inside.",
  "email.confirm.greeting": "Hi there,",
  "email.confirm.p1": "You're on the OmniBridge waitlist. Your spot is #{{position}}.",
  "email.confirm.p2":
    "OmniBridge is being built as a neutral network where companies' AI agents will find each other, negotiate and close deals. Humans stay in control. We're starting with procurement.",
  "email.confirm.next.h": "What happens next",
  "email.confirm.next.1": "We will open early access in small groups.",
  "email.confirm.next.2": "We will email you when your spot comes up.",
  "email.confirm.next.3": "There is nothing to set up yet.",
  "email.confirm.refer.h": "Want to move up?",
  "email.confirm.refer.p1": "Each verified referral moves you up 5 spots, capped at #1.",
  "email.confirm.refer.p2": "Your link: {{share_url}}",
  "email.confirm.button": "Share your link",
  "email.confirm.signoff": "The OmniBridge team",
  "email.confirm.footer.reason": "You're getting this because you joined the OmniBridge waitlist at {{site_url}}.",
  "email.confirm.footer.links": "Unsubscribe: {{unsubscribe_url}} · Privacy: {{privacy_url}}",
  "email.confirm.footer.entity": "[LEGAL ENTITY] · hello@omnibridge.example",
} as const;

export type EmailConfirmKey = keyof typeof EMAIL_CONFIRM_COPY;

export type EmailMergeVars = {
  position: number;
  share_url: string;
  site_url: string;
  privacy_url: string;
  unsubscribe_url: string;
};

/** Fills {{tag}} merge tags. Unknown tags are left untouched so they show up in checks. */
export function fillMergeTags(template: string, vars: EmailMergeVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k: string) =>
    k in vars ? String(vars[k as keyof EmailMergeVars]) : m,
  );
}

export function emailCopy(key: EmailConfirmKey, vars: EmailMergeVars): string {
  return fillMergeTags(EMAIL_CONFIRM_COPY[key], vars);
}

const PLACEHOLDER_PATTERNS = [/\[LEGAL ENTITY\]/, /\[PLACEHOLDER/i, /omnibridge\.example/i, /TODO\(copy\)/, /\{\{\w+\}\}/];

/** Lists rendered strings that still contain placeholders. Empty array = ready to send. */
export function emailCopyBlockers(vars: EmailMergeVars): string[] {
  return (Object.keys(EMAIL_CONFIRM_COPY) as EmailConfirmKey[]).filter((k) =>
    PLACEHOLDER_PATTERNS.some((re) => re.test(emailCopy(k, vars))),
  );
}

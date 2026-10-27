import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { createElement } from "react";
import WaitlistConfirmation, {
  mergeVars,
  waitlistConfirmationSubject,
  type WaitlistConfirmationProps,
} from "../emails/WaitlistConfirmation";
import { emailCopyBlockers } from "./copy/emailConfirm";
import { env } from "./env";
import { supabaseAdmin } from "./supabaseAdmin";

type Status = "sent" | "failed" | "skipped";

/**
 * Sends the confirmation email via the official Resend SDK and records the
 * outcome in waitlist_signups.confirmation_email_status. Never throws.
 * Uses an idempotency key per signup so retries do not double-send.
 */
export async function sendWaitlistConfirmation(args: {
  signupId: string;
  to: string;
  position: number;
  shareUrl: string;
}): Promise<Status> {
  const apiKey = env.resendApiKey();
  const from = env.resendFrom();
  const unsubscribeUrl = env.unsubscribeUrl();
  const props: WaitlistConfirmationProps = {
    position: args.position,
    shareUrl: args.shareUrl,
    siteUrl: env.siteUrl(),
    privacyUrl: `${env.siteUrl()}/privacy`,
    unsubscribeUrl: unsubscribeUrl ?? "",
  };
  let status: Status;

  if (!env.emailEnabled() || !apiKey || !from) {
    console.warn("[waitlist] confirmation email disabled or RESEND_API_KEY / RESEND_FROM not set; skipping");
    status = "skipped";
  } else if (!unsubscribeUrl || emailCopyBlockers(mergeVars(props)).length > 0) {
    // Hard gate: never send while the copy still has placeholders ([LEGAL ENTITY],
    // hello@omnibridge.example) or there is no unsubscribe URL.
    console.warn(
      "[waitlist] confirmation email blocked: placeholders in copy or WAITLIST_UNSUBSCRIBE_URL unset",
      emailCopyBlockers(mergeVars(props)),
    );
    status = "skipped";
  } else {
    try {
      const element = createElement(WaitlistConfirmation, props);
      const [html, text] = await Promise.all([
        render(element),
        render(element, { plainText: true }),
      ]);
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send(
        {
          from,
          to: args.to,
          subject: waitlistConfirmationSubject(props),
          html,
          text,
          ...(env.resendReplyTo() ? { replyTo: env.resendReplyTo() } : {}),
          tags: [{ name: "category", value: "waitlist_confirmation" }],
        },
        { idempotencyKey: `waitlist-confirmation/${args.signupId}` },
      );
      status = error ? "failed" : "sent";
      if (error) console.error("[waitlist] Resend error", error.name, error.message);
    } catch (e) {
      console.error("[waitlist] Resend send threw", e instanceof Error ? e.message : e);
      status = "failed";
    }
  }

  const { error: dbError } = await supabaseAdmin().rpc("waitlist_set_email_status", {
    p_id: args.signupId,
    p_status: status,
  });
  if (dbError) console.error("[waitlist] failed to record email status", dbError.message);
  return status;
}

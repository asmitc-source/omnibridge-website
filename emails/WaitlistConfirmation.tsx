import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailCopy, type EmailMergeVars } from "../lib/copy/emailConfirm";

/*
 * All user-facing text comes from the approved copy deck v1.1 (C3.3) via
 * lib/copy/emailConfirm.ts. No copy is written in this file.
 * Email is OFF for launch (WAITLIST_EMAIL_ENABLED=false, RESEND_FROM empty).
 */

export type WaitlistConfirmationProps = {
  position: number;
  shareUrl: string;
  siteUrl: string;
  privacyUrl: string;
  unsubscribeUrl: string;
};

export function mergeVars(p: WaitlistConfirmationProps): EmailMergeVars {
  return {
    position: p.position,
    share_url: p.shareUrl,
    site_url: p.siteUrl,
    privacy_url: p.privacyUrl,
    unsubscribe_url: p.unsubscribeUrl,
  };
}

export function waitlistConfirmationSubject(p: WaitlistConfirmationProps): string {
  return emailCopy("email.confirm.subject", mergeVars(p));
}

const muted = { fontSize: 12, color: "#666666" } as const;

export default function WaitlistConfirmation(props: WaitlistConfirmationProps) {
  const v = mergeVars(props);
  const t = (k: Parameters<typeof emailCopy>[0]) => emailCopy(k, v);
  return (
    <Html lang="en">
      <Head />
      <Preview>{t("email.confirm.preheader")}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px" }}>
          <Text>{t("email.confirm.greeting")}</Text>
          <Text>{t("email.confirm.p1")}</Text>
          <Text>{t("email.confirm.p2")}</Text>
          <Heading as="h2" style={{ fontSize: 18 }}>
            {t("email.confirm.next.h")}
          </Heading>
          <Text>
            {t("email.confirm.next.1")}
            <br />
            {t("email.confirm.next.2")}
            <br />
            {t("email.confirm.next.3")}
          </Text>
          <Heading as="h2" style={{ fontSize: 18 }}>
            {t("email.confirm.refer.h")}
          </Heading>
          <Text>{t("email.confirm.refer.p1")}</Text>
          <Text>{t("email.confirm.refer.p2")}</Text>
          <Section style={{ margin: "16px 0" }}>
            <Button
              href={props.shareUrl}
              style={{ backgroundColor: "#111111", color: "#ffffff", padding: "10px 16px", borderRadius: 6 }}
            >
              {t("email.confirm.button")}
            </Button>
          </Section>
          <Text>{t("email.confirm.signoff")}</Text>
          <Hr />
          <Text style={muted}>{t("email.confirm.footer.reason")}</Text>
          <Text style={muted}>{t("email.confirm.footer.links")}</Text>
          <Text style={muted}>{t("email.confirm.footer.entity")}</Text>
        </Container>
      </Body>
    </Html>
  );
}

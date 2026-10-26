import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/*
 * ============================================================================
 * TODO(copy): ALL user-facing text in this file is PLACEHOLDER copy written by
 * Backend so the pipeline can be tested. Copy has not delivered final text.
 * Replace every string marked TODO(copy) before launch. Do not add claims
 * about customers, metrics, testimonials, or features being live.
 * ============================================================================
 */

// TODO(copy): subject line
export const WAITLIST_CONFIRMATION_SUBJECT = "[PLACEHOLDER] You're on the OmniBridge waitlist";

export type WaitlistConfirmationProps = {
  position: number;
  shareUrl: string;
};

export default function WaitlistConfirmation({ position, shareUrl }: WaitlistConfirmationProps) {
  return (
    <Html lang="en">
      <Head />
      {/* TODO(copy): preview text */}
      <Preview>[PLACEHOLDER] You're on the OmniBridge waitlist</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px" }}>
          {/* TODO(copy): heading */}
          <Heading as="h1" style={{ fontSize: 22 }}>
            [PLACEHOLDER] Thanks for joining the waitlist
          </Heading>
          {/* TODO(copy): body paragraph. Position is the live value at send time. */}
          <Text>[PLACEHOLDER] Your current position is #{position}. Positions can change as people refer others.</Text>
          {/* TODO(copy): referral explanation */}
          <Text>[PLACEHOLDER] Share your link to move up the list:</Text>
          <Section style={{ margin: "16px 0" }}>
            <Button
              href={shareUrl}
              style={{ backgroundColor: "#111111", color: "#ffffff", padding: "10px 16px", borderRadius: 6 }}
            >
              {/* TODO(copy): button label */}
              [PLACEHOLDER] Copy your referral link
            </Button>
          </Section>
          <Text style={{ fontSize: 12, color: "#666666" }}>{shareUrl}</Text>
          {/* TODO(copy): footer / why you got this email / privacy-note link (pending privacy note) */}
          <Text style={{ fontSize: 12, color: "#666666" }}>
            [PLACEHOLDER] You received this because this address was submitted on the OmniBridge waitlist form.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

import { z } from "zod";

export const WAITLIST_TYPES = ["buyer", "supplier", "developer"] as const;
export type WaitlistType = (typeof WAITLIST_TYPES)[number];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/** Everything except email (email has its own 400 invalid_email path). */
export const waitlistBodySchema = z.object({
  email: z.string(),
  company: optionalText(200),
  role: optionalText(200),
  type: z.enum(WAITLIST_TYPES).optional().nullable().transform((v) => v ?? null),
  agents_used: optionalText(1000),
  ref: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .nullable()
    .transform((v) => (v && /^[a-z2-9]{8}$/.test(v) ? v : null)),
});

export type WaitlistBody = z.infer<typeof waitlistBodySchema>;

export const referralCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z2-9]{8}$/);

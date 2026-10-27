"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useReducedMotion, motion } from "framer-motion";
import { isValidEmailSyntax, normaliseEmail } from "@/lib/email";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { copy, type CopyKey } from "@/lib/copy";
import { T } from "@/components/ui/Copy";

type TypeValue = "" | "buyer" | "supplier" | "developer";
type Field = "email" | "company" | "role" | "type" | "agents";

type Success = {
  already: boolean;
  position: number;
  shareUrl: string;
};

const TYPE_KEYS: Record<Exclude<TypeValue, "">, CopyKey> = {
  buyer: "form.type.buyer",
  supplier: "form.type.supplier",
  developer: "form.type.developer",
};

function minutes(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60));
}

export function WaitlistForm({
  heading = "h3",
  preset = "",
}: {
  heading?: "h2" | "h3";
  preset?: string;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const bannerRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const agentsRef = useRef<HTMLTextAreaElement>(null);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [agents, setAgents] = useState("");
  const [type, setType] = useState<TypeValue>(
    preset === "buyer" || preset === "supplier" || preset === "developer" ? preset : "",
  );
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);
  const [copyState, setCopyState] = useState<"" | "ok" | "fail">("");
  const [live, setLive] = useState("");

  useEffect(() => {
    if (!banner) return;
    const first = errors.email
      ? emailRef.current
      : errors.company
        ? companyRef.current
        : errors.role
          ? roleRef.current
          : errors.agents
            ? agentsRef.current
            : null;
    (first ?? bannerRef.current)?.focus();
  }, [banner, errors]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    const normalised = normaliseEmail(email);
    if (!email.trim()) next.email = copy("form.email.error.required");
    else if (!isValidEmailSyntax(normalised)) next.email = copy("form.email.error.invalid");
    if (company.trim().length > 200) next.company = copy("form.company.error.too_long");
    if (role.trim().length > 200) next.role = copy("form.role.error.too_long");
    if (agents.trim().length > 1000) next.agents = copy("form.agents.error.too_long");
    if (Object.keys(next).length > 0) {
      setErrors(next);
      setBanner(copy("form.error.validation_error"));
      return;
    }
    setErrors({});
    setBanner("");
    setBusy(true);
    const honeypot = (event.currentTarget.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null)?.value ?? "";
    const stored = sessionStorage.getItem("ob_ref") ?? "";
    const ref = /^[a-z2-9]{8}$/.test(stored) ? stored : null;
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalised,
          company: company.trim() || null,
          role: role.trim() || null,
          type: type || null,
          agents_used: agents.trim() || null,
          ref,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok: true;
            already_registered: boolean;
            position: number;
            share_url: string;
          }
        | {
            ok: false;
            error?: { code?: string; retry_after_seconds?: number; fields?: Record<string, string[]> };
          }
        | null;
      if (!response.ok || !payload || payload.ok !== true) {
        const error = payload && "error" in payload ? payload.error : undefined;
        const mapped = mapError(error);
        setErrors(mapped.fields);
        setBanner(mapped.banner);
        setBusy(false);
        return;
      }
      setSuccess({
        already: payload.already_registered,
        position: payload.position,
        shareUrl: payload.share_url,
      });
      setLive(
        payload.already_registered
          ? copy("form.success.already.body", { position: payload.position })
          : copy("form.success.announce", { position: payload.position }),
      );
    } catch {
      setBanner(copy("form.error.network"));
      setBusy(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("ok");
      setLive(copy("referral.copied"));
    } catch {
      setCopyState("fail");
      setLive(copy("referral.copy_failed"));
    }
    window.setTimeout(() => setCopyState(""), 2000);
  }

  const Heading = heading === "h2" ? "h2" : "h3";

  if (success) {
    const positionText = copy("form.success.position", { position: "\u0000" }).split("\u0000");
    const subject = copy("referral.share.email.subject", { share_url: success.shareUrl });
    const body = copy("referral.share.email.body", { share_url: success.shareUrl });
    const xHref = `https://x.com/intent/post?text=${encodeURIComponent(copy("referral.share.x.text", { share_url: success.shareUrl }))}`;
    const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(success.shareUrl)}`;
    const mailHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return (
      <div className="form-card glass" aria-labelledby={titleId}>
        <Heading id={titleId} className={heading === "h2" ? "type-h2" : "type-h3"}>
          {success.already ? copy("form.success.already.h") : copy("form.success.h")}
        </Heading>
        {success.already ? (
          <p>
            <T k="form.success.already.body" vars={{ position: success.position }} />
          </p>
        ) : (
          <>
            <p className="type-display-l" style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {positionText[0]}
              <motion.span
                initial={reduce ? false : { y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                {success.position}
              </motion.span>
              {positionText[1]}
            </p>
            <p>{copy("form.success.body")}</p>
            <p>{copy("form.success.save")}</p>
          </>
        )}
        <h3 className="type-h4">{copy("referral.h")}</h3>
        <div className="field">
          <label htmlFor="referral-link">{copy("referral.link.label")}</label>
          <input id="referral-link" readOnly value={success.shareUrl} />
          <button type="button" className="btn btn-secondary" onClick={() => void copyLink(success.shareUrl)}>
            <span className={copyState === "ok" ? "copied" : copyState === "fail" ? "error" : undefined}>
              {copyState === "ok" ? copy("referral.copied") : copyState === "fail" ? copy("referral.copy_failed") : copy("referral.copy")}
            </span>
          </button>
        </div>
        <h3 className="type-h4">{copy("referral.share.h")}</h3>
        <div className="share-row">
          <a className="btn btn-text" href={xHref} target="_blank" rel="noopener noreferrer">
            {copy("referral.share.x.label")}
          </a>
          <a
            className="btn btn-text"
            href={linkedInHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              void navigator.clipboard
                .writeText(copy("referral.share.linkedin.text", { share_url: success.shareUrl }))
                .catch(() => undefined);
            }}
          >
            {copy("referral.share.linkedin.label")}
          </a>
          <a className="btn btn-text" href={mailHref}>
            {copy("referral.share.email.label")}
          </a>
          <button type="button" className="btn btn-text" onClick={() => void copyLink(success.shareUrl)}>
            {copy("referral.share.copy.label")}
          </button>
        </div>
        <ul>
          <li>{copy("referral.rule.bump")}</li>
          <li>{copy("referral.rule.verified")}</li>
          <li>{copy("referral.rule.tiebreak")}</li>
        </ul>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    );
  }

  return (
    <form className="form-card glass" onSubmit={onSubmit} noValidate aria-labelledby={titleId} aria-busy={busy || undefined}>
      <Heading id={titleId} className={heading === "h2" ? "type-h2" : "type-h3"}>
        {copy("form.title")}
      </Heading>
      <p className="muted">{copy("form.required_hint")}</p>
      {banner ? (
        <div ref={bannerRef} className="banner" role="alert" tabIndex={-1}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" />
            <path d="M10 6v5" stroke="var(--color-amber)" strokeWidth="1.5" />
            <circle cx="10" cy="14" r="1" fill="var(--color-amber)" />
          </svg>
          <span>{banner}</span>
        </div>
      ) : null}
      <div className="form-grid">
        <Field
          id="email"
          label={copy("form.email.label")}
          hint={copy("form.email.helper")}
          error={errors.email}
        >
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={copy("form.email.placeholder")}
            value={email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error email-hint" : "email-hint"}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>
      <div className="form-grid two">
        <Field id="company" label={copy("form.company.label")} hint={copy("form.company.helper")} error={errors.company}>
          <input
            ref={companyRef}
            id="company"
            name="company"
            autoComplete="organization"
            placeholder={copy("form.company.placeholder")}
            value={company}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? "company-error company-hint" : "company-hint"}
            onChange={(event) => setCompany(event.target.value)}
          />
        </Field>
        <Field id="role" label={copy("form.role.label")} hint={copy("form.role.helper")} error={errors.role}>
          <input
            ref={roleRef}
            id="role"
            name="role"
            autoComplete="organization-title"
            placeholder={copy("form.role.placeholder")}
            value={role}
            aria-invalid={errors.role ? true : undefined}
            aria-describedby={errors.role ? "role-error role-hint" : "role-hint"}
            onChange={(event) => setRole(event.target.value)}
          />
        </Field>
      </div>
      <fieldset className={`field${errors.type ? " has-error" : ""}`}>
        <legend>{copy("form.type.legend")}</legend>
        <div className="radios">
          {(Object.keys(TYPE_KEYS) as Exclude<TypeValue, "">[]).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
              />
              {copy(TYPE_KEYS[value])}
            </label>
          ))}
        </div>
        <button type="button" className="btn btn-text" onClick={() => setType("")}>
          {copy("form.type.clear")}
        </button>
        <p id="type-hint" className="hint muted">
          {copy("form.type.helper")}
        </p>
        {errors.type ? (
          <p id="type-error" className="error">
            {errors.type}
          </p>
        ) : null}
      </fieldset>
      <Field id="agents" label={copy("form.agents.label")} hint={copy("form.agents.helper")} error={errors.agents}>
        <textarea
          ref={agentsRef}
          id="agents"
          name="agents_used"
          placeholder={copy("form.agents.placeholder")}
          value={agents}
          aria-invalid={errors.agents ? true : undefined}
          aria-describedby={errors.agents ? "agents-error agents-hint" : "agents-hint"}
          onChange={(event) => setAgents(event.target.value)}
        />
      </Field>
      <div className="hp" aria-hidden="true">
        <label htmlFor="hp">{copy("form.honeypot.label")}</label>
        <input id="hp" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
      </div>
      <p className="muted">
        <T k="form.consent" linkPhrases />
      </p>
      <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy || undefined}>
        {copy("form.submit")}
        {busy ? <span className="sr-only">{copy("form.loading")}</span> : null}
      </button>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      <p id={`${id}-hint`} className="hint muted">
        {hint}
      </p>
      {error ? (
        <p id={`${id}-error`} className="error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function mapError(error: { code?: string; retry_after_seconds?: number; fields?: Record<string, string[]> } | undefined): {
  banner: string;
  fields: Partial<Record<Field, string>>;
} {
  const fields: Partial<Record<Field, string>> = {};
  const code = error?.code;
  if (code === "invalid_email") {
    fields.email = copy("form.email.error.invalid");
    return { banner: copy("form.error.validation_error"), fields };
  }
  if (code === "disposable_email") {
    fields.email = copy("form.email.error.disposable");
    return { banner: copy("form.error.validation_error"), fields };
  }
  if (code === "rate_limited") {
    const seconds = error?.retry_after_seconds;
    return {
      banner:
        typeof seconds === "number"
          ? copy("form.error.rate_limited", { retry_after_minutes: minutes(seconds) })
          : copy("form.error.rate_limited_nowait"),
      fields,
    };
  }
  if (code === "forbidden_origin") return { banner: copy("form.error.forbidden_origin"), fields };
  if (code === "validation_error") {
    if (error?.fields?.email) fields.email = copy("form.email.error.invalid");
    if (error?.fields?.company) fields.company = copy("form.company.error.too_long");
    if (error?.fields?.role) fields.role = copy("form.role.error.too_long");
    if (error?.fields?.agents_used) fields.agents = copy("form.agents.error.too_long");
    if (error?.fields?.type) fields.type = copy("form.type.error.invalid");
    return {
      banner: Object.keys(fields).length ? copy("form.error.validation_error") : copy("form.error.validation_error_generic"),
      fields,
    };
  }
  return { banner: copy("form.error.server_error"), fields };
}

import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "text";

const VARIANT: Record<Variant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  text: "btn btn-text",
};

function Arrow() {
  return (
    <svg className="btn-arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  arrow = true,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <a className={`${VARIANT[variant]} ${className}`.trim()} href={href}>
      {children}
      {arrow && variant === "primary" ? <Arrow /> : null}
    </a>
  );
}

export function Button({
  children,
  variant = "primary",
  arrow = false,
  className = "",
  type = "button",
  disabled = false,
  busy = false,
  onClick,
}: {
  children: ReactNode;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`${VARIANT[variant]} ${className}`.trim()}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={onClick}
    >
      {children}
      {arrow && variant === "primary" ? <Arrow /> : null}
    </button>
  );
}

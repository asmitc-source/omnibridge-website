import type { ReactNode } from "react";

type SiteShellProps = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** Landmark shell. Header and footer render only when a caller passes them. */
export function SiteShell({ header, children, footer }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      {footer}
    </div>
  );
}

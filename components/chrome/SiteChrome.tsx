"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { copy, type CopyKey } from "@/lib/copy";
import { ButtonLink } from "@/components/ui/Button";
import { CommandBar } from "@/components/chrome/CommandBar";

const LINKS: { href: string; key: CopyKey }[] = [
  { href: "/product", key: "nav.product" },
  { href: "/how-it-works", key: "nav.how" },
  { href: "/trust", key: "nav.trust" },
  { href: "/procurement", key: "nav.procurement" },
  { href: "/suppliers", key: "nav.suppliers" },
  { href: "/manifesto", key: "nav.manifesto" },
];

const STICKY_CTA = new Set(["/", "/product", "/procurement", "/suppliers", "/trust"]);

export function RefCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref && /^[a-z2-9]{8}$/i.test(ref)) sessionStorage.setItem("ob_ref", ref.toLowerCase());
  }, [params]);
  return null;
}

export function SiteHeader() {
  const path = usePathname();
  const menuTitle = useId();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const desktop = window.matchMedia("(min-width: 1025px)").matches;
      setHidden(desktop && y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const root = document.getElementById(menuTitle);
    const selector = 'a[href], button:not([disabled])';
    const nodes = () => (root ? [...root.querySelectorAll<HTMLElement>(selector)] : []);
    nodes()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const list = nodes();
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, menuTitle]);

  return (
    <header className={`site-header glass${hidden ? " is-hidden" : ""}`}>
      <div className="container site-header-inner">
        <Link className="wordmark" href="/" aria-label={copy("nav.home.aria")}>
          {copy("nav.wordmark")}
          <span className="packet-dot" aria-hidden="true" />
        </Link>
        <span className="badge">
          <span className="packet-dot" aria-hidden="true" />
          {copy("nav.badge")}
        </span>
        <nav className="nav-links" aria-label={copy("nav.aria")}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} aria-current={path === link.href ? "page" : undefined}>
              {copy(link.key)}
            </a>
          ))}
        </nav>
        <div className="header-spacer">
          <CommandBar />
          <button
            type="button"
            className="icon-btn"
            aria-expanded={open}
            aria-controls={menuTitle}
            aria-label={open ? copy("nav.menu.close") : copy("nav.menu.open")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
          <ButtonLink className="nav-cta-desktop" href="/waitlist">
            {copy("nav.cta")}
          </ButtonLink>
        </div>
      </div>
      <div className="mobile-menu" id={menuTitle} role="dialog" aria-modal="true" aria-label={copy("nav.menu.open")} hidden={!open}>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          {copy("nav.menu.close")}
        </button>
        {LINKS.map((link) => (
          <a key={link.href} className="menu-link" href={link.href}>
            {copy(link.key)}
          </a>
        ))}
        <ButtonLink href="/waitlist">{copy("nav.cta")}</ButtonLink>
      </div>
    </header>
  );
}

export function MobileCta() {
  const path = usePathname();
  const [pastHero, setPastHero] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    if (!STICKY_CTA.has(path)) return;
    const hero = document.getElementById("hero");
    const form = document.getElementById("join");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.id === "hero") setPastHero(!entry.isIntersecting);
        if (entry.target.id === "join") setJoinVisible(entry.isIntersecting);
      }
    });
    if (hero) observer.observe(hero);
    if (form) observer.observe(form);
    const onBlock = (event: Event) => {
      setOverlay(Boolean((event as CustomEvent<boolean | string | null>).detail));
    };
    window.addEventListener("ob-overlay", onBlock);
    return () => {
      observer.disconnect();
      window.removeEventListener("ob-overlay", onBlock);
    };
  }, [path]);

  if (!STICKY_CTA.has(path) || !pastHero || joinVisible || overlay) return null;
  return (
    <div className="mobile-cta-bar">
      <ButtonLink href="/waitlist">{copy("nav.cta")}</ButtonLink>
    </div>
  );
}

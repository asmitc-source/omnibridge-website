"use client";

import { useEffect, useMemo, useState } from "react";
import { copy, type CopyKey } from "@/lib/copy";

type Item = { group: CopyKey; label: CopyKey; href?: string; action?: "replay" | "email" | "cookies" };

const ITEMS: Item[] = [
  { group: "cmdk.group.pages", label: "cmdk.page.home", href: "/" },
  { group: "cmdk.group.pages", label: "cmdk.page.product", href: "/product" },
  { group: "cmdk.group.pages", label: "cmdk.page.how", href: "/how-it-works" },
  { group: "cmdk.group.pages", label: "cmdk.page.trust", href: "/trust" },
  { group: "cmdk.group.pages", label: "cmdk.page.suppliers", href: "/suppliers" },
  { group: "cmdk.group.pages", label: "cmdk.page.procurement", href: "/procurement" },
  { group: "cmdk.group.pages", label: "cmdk.page.developers", href: "/developers" },
  { group: "cmdk.group.pages", label: "cmdk.page.manifesto", href: "/manifesto" },
  { group: "cmdk.group.pages", label: "cmdk.page.faq", href: "/faq" },
  { group: "cmdk.group.pages", label: "cmdk.page.waitlist", href: "/waitlist" },
  { group: "cmdk.group.pages", label: "cmdk.page.privacy", href: "/privacy" },
  { group: "cmdk.group.pages", label: "cmdk.page.terms", href: "/terms" },
  { group: "cmdk.group.sections", label: "cmdk.section.home_demo", href: "/#demo" },
  { group: "cmdk.group.sections", label: "cmdk.section.home_faq", href: "/#faq" },
  { group: "cmdk.group.sections", label: "cmdk.section.how_steps", href: "/how-it-works#steps" },
  { group: "cmdk.group.sections", label: "cmdk.section.trust_alert", href: "/trust#alert" },
  { group: "cmdk.group.sections", label: "cmdk.section.trust_kill", href: "/trust#kill" },
  { group: "cmdk.group.sections", label: "cmdk.section.procurement_demo", href: "/procurement#demo" },
  { group: "cmdk.group.sections", label: "cmdk.section.suppliers_agent", href: "/suppliers#hosted" },
  { group: "cmdk.group.actions", label: "cmdk.action.waitlist", href: "/waitlist" },
  { group: "cmdk.group.actions", label: "cmdk.action.replay", action: "replay" },
  { group: "cmdk.group.actions", label: "cmdk.action.cookies", action: "cookies" },
  { group: "cmdk.group.actions", label: "cmdk.action.copy_email", action: "email" },
];

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState("");
  const [mac, setMac] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((item) => !q || copy(item.label).toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ob-overlay", { detail: open }));
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  async function run(item: Item) {
    if (item.action === "replay") window.dispatchEvent(new Event("ob-replay"));
    if (item.action === "cookies") window.dispatchEvent(new Event("ob-cookies"));
    if (item.action === "email") {
      await navigator.clipboard.writeText(copy("footer.contact.email"));
      setToast(copy("cmdk.action.copy_email.done"));
    }
    setOpen(false);
    setQuery("");
    if (item.href && !item.action) window.location.assign(item.href);
  }

  return (
    <>
      <button type="button" className="btn btn-text cmdk-trigger" onClick={() => setOpen(true)} aria-label={copy("cmdk.trigger.aria")}>
        <span className="cmdk-label">{copy("cmdk.trigger.label")}</span>
        <span aria-hidden="true">{mac ? copy("cmdk.trigger.shortcut_mac") : copy("cmdk.trigger.shortcut_other")}</span>
      </button>
      {open ? (
        <div className="cmdk" onMouseDown={() => setOpen(false)}>
          <div
            className="cmdk-panel glass"
            role="dialog"
            aria-modal="true"
            aria-label={copy("cmdk.dialog.aria")}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-list"
              aria-activedescendant={`cmdk-${active}`}
              placeholder={copy("cmdk.placeholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((value) => Math.min(results.length - 1, value + 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((value) => Math.max(0, value - 1));
                }
                if (event.key === "Enter" && results[active]) void run(results[active]);
              }}
            />
            <div id="cmdk-list" role="listbox">
              {results.length === 0 ? <p className="muted" style={{ padding: 16 }}>{copy("cmdk.empty")}</p> : null}
              {results.map((item, index) => {
                const previous = results[index - 1];
                return (
                  <div key={item.label + (item.href ?? item.action)}>
                    {previous?.group !== item.group ? (
                      <p className="solid-meta" style={{ padding: "8px 16px", margin: 0 }}>
                        {copy(item.group)}
                      </p>
                    ) : null}
                    <button
                      id={`cmdk-${index}`}
                      type="button"
                      className="row"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => void run(item)}
                    >
                      {copy(item.label)}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="solid-meta" style={{ padding: "8px 16px" }}>
              {copy("cmdk.hint")}
            </p>
          </div>
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {toast}
      </p>
    </>
  );
}

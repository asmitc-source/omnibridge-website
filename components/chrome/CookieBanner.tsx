"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { T } from "@/components/ui/Copy";

const STORAGE = "ob_cookie";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [nonessential, setNonessential] = useState(false);
  const [toast, setToast] = useState("");

  useLayoutEffect(() => {
    window.dispatchEvent(new CustomEvent("ob-overlay", { detail: open }));
    const root = document.documentElement;
    const copy = document.querySelector<HTMLElement>(".hero-copy");
    const poster = document.querySelector<HTMLElement>(".hero > .poster-stack");
    const clearHero = () => {
      if (copy) copy.style.transform = "";
      if (poster) poster.style.maxHeight = "";
    };
    if (!open) {
      delete root.dataset.cookie;
      root.style.removeProperty("--cookie-h");
      clearHero();
      return;
    }
    root.dataset.cookie = "open";
    const node = document.querySelector<HTMLElement>(".cookie");
    if (!node) return;
    const fit = () => {
      root.style.setProperty("--cookie-h", `${Math.ceil(node.getBoundingClientRect().height)}px`);
      if (!copy) return;
      copy.style.transform = "";
      if (poster) poster.style.maxHeight = "";
      if (prefs) return;
      const actions = document.querySelector<HTMLElement>(".hero .hero-actions");
      const h1 = document.querySelector<HTMLElement>(".hero h1");
      const header = document.querySelector<HTMLElement>(".site-header");
      if (!actions || !h1) return;
      const gap = node.getBoundingClientRect().top - actions.getBoundingClientRect().bottom;
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const maxLift = Math.max(0, h1.getBoundingClientRect().top - headerBottom - 12);
      const lift = Math.min(Math.max(0, Math.ceil(180 - gap)), maxLift);
      if (lift > 0) copy.style.transform = `translateY(-${lift}px)`;
      if (poster) {
        poster.style.maxHeight = "";
        const text = copy.getBoundingClientRect();
        const box = poster.getBoundingClientRect();
        const overlaps = box.bottom > text.top + 4 && box.top < text.bottom && box.right > text.left + 8 && box.left < text.right - 8;
        if (overlaps) {
          const room = text.top - box.top - 12;
          poster.style.maxHeight = `${Math.max(0, Math.floor(room))}px`;
        }
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      clearHero();
    };
  }, [open, prefs]);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE)) setOpen(true);
    const onOpen = () => {
      setOpen(true);
      setPrefs(true);
    };
    window.addEventListener("ob-cookies", onOpen);
    return () => window.removeEventListener("ob-cookies", onOpen);
  }, []);

  function save(value: "accept" | "reject" | "custom") {
    const allow = value === "accept" ? true : value === "reject" ? false : nonessential;
    localStorage.setItem(STORAGE, JSON.stringify({ nonessential: allow }));
    setNonessential(allow);
    setToast(copy("cookie.saved"));
    setOpen(false);
    setPrefs(false);
  }

  return (
    <>
      {open ? (
        <aside className={prefs ? "cookie glass is-prefs" : "cookie glass"} aria-label={copy("cookie.title")}>
          <h2 className="type-h4" style={{ margin: 0 }}>
            {copy("cookie.title")}
          </h2>
          <p className="muted">
            <T k="cookie.body" />
          </p>
          {prefs ? (
            <div>
              <h3 className="type-h4">{copy("cookie.prefs.title")}</h3>
              <p className="muted">{copy("cookie.prefs.intro")}</p>
              <p>
                <strong>{copy("cookie.prefs.essential.label")}</strong> {copy("cookie.prefs.essential.state")}
              </p>
              <p className="muted">{copy("cookie.prefs.essential.desc")}</p>
              <p>
                <strong>{copy("cookie.prefs.analytics.label")}</strong> {copy("cookie.prefs.analytics.state")}
              </p>
              <p className="muted">{copy("cookie.prefs.analytics.desc")}</p>
              <p>
                <strong>{copy("cookie.prefs.nonessential.label")}</strong>
              </p>
              <p className="muted">{copy("cookie.prefs.nonessential.desc")}</p>
              <div className="radios">
                <label>
                  <input
                    type="radio"
                    name="nonessential"
                    checked={nonessential}
                    onChange={() => setNonessential(true)}
                  />
                  {copy("cookie.prefs.nonessential.on")}
                </label>
                <label>
                  <input
                    type="radio"
                    name="nonessential"
                    checked={!nonessential}
                    onChange={() => setNonessential(false)}
                  />
                  {copy("cookie.prefs.nonessential.off")}
                </label>
              </div>
              <div className="cookie-actions">
                <button type="button" className="btn btn-secondary" onClick={() => save("custom")}>
                  {copy("cookie.prefs.save")}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setPrefs(false)}>
                  {copy("cookie.prefs.close")}
                </button>
              </div>
            </div>
          ) : (
            <div className="cookie-actions">
              <button type="button" className="btn btn-secondary" onClick={() => save("reject")}>
                {copy("cookie.reject")}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => save("accept")}>
                {copy("cookie.accept")}
              </button>
              <button type="button" className="btn btn-text" onClick={() => setPrefs(true)}>
                {copy("cookie.prefs")}
              </button>
              <a href="/privacy">{copy("cookie.policy_link")}</a>
            </div>
          )}
        </aside>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {toast}
      </p>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { T } from "@/components/ui/Copy";

const STORAGE = "ob_cookie";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [nonessential, setNonessential] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ob-overlay", { detail: open }));
  }, [open]);

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
        <aside className="cookie glass" aria-label={copy("cookie.title")}>
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

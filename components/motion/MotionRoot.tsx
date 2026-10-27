"use client";

import { useEffect } from "react";

export function MotionRoot() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    let destroy: () => void = () => undefined;
    let cancelled = false;
    const start = () => {
      void import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        const lenis = new Lenis({ autoRaf: true });
        destroy = () => {
          lenis.destroy();
        };
      });
    };
    if (document.readyState === "complete") {
      if (window.requestIdleCallback) {
        const id = window.requestIdleCallback(start);
        return () => {
          cancelled = true;
          window.cancelIdleCallback(id);
          destroy();
        };
      }
      const id = window.setTimeout(start, 1);
      return () => {
        cancelled = true;
        window.clearTimeout(id);
        destroy();
      };
    }
    window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      destroy();
    };
  }, []);
  return null;
}

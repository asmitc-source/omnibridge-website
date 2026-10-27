"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { copy, type CopyKey } from "@/lib/copy";
import { T } from "@/components/ui/Copy";
import scriptJson from "@/lib/copy/demo.script.json";
import { PausePulse } from "./PausePulse";
import { RedAlertModal } from "./RedAlertModal";

type Step = {
  id: string;
  branch: string;
  t_ms: number;
  speaker: string;
  type: string;
  price: number | null;
  ui_event: string | null;
};

const script = scriptJson as { trust_excerpt_start: string; steps: Step[] };
const STEPS = script.steps;
const byId = new Map(STEPS.map((step) => [step.id, step]));

const TEXT: Record<string, CopyKey> = {
  s01: "demo.step.s01.text",
  s02: "demo.step.s02.text",
  s03: "demo.step.s03.text",
  s04: "demo.step.s04.text",
  s05: "demo.step.s05.text",
  s06: "demo.step.s06.text",
  s07: "demo.step.s07.text",
  s08: "demo.step.s08.text",
  s09: "demo.step.s09.text",
  s10: "demo.step.s10.text",
  s11: "demo.step.s11.text",
  s12: "demo.step.s12.text",
  s13a: "demo.step.s13a.text",
  s14a: "demo.step.s14a.text",
  s15a: "demo.step.s15a.text",
  s13b: "demo.step.s13b.text",
  s14b: "demo.step.s14b.text",
  s15b: "demo.step.s15b.text",
};

const LABEL: Record<string, CopyKey> = {
  system: "demo.cast.system.label",
  buyer: "demo.cast.buyer.label",
  supplier_a: "demo.cast.supplier_a.label",
  supplier_b: "demo.cast.supplier_b.label",
  supplier_c: "demo.cast.supplier_c.label",
  approver: "demo.cast.approver.label",
};

function branchOf(kind: "approve" | "reject" | null): Step[] {
  if (!kind) return [];
  return STEPS.filter((step) => step.branch === kind);
}

export function DemoSimulation({
  startAt,
  captionKey,
}: {
  startAt?: string;
  captionKey?: CopyKey;
}) {
  const roomRef = useRef<HTMLDivElement>(null);
  const outcomeRef = useRef<HTMLHeadingElement>(null);
  const main = useMemo(() => STEPS.filter((step) => step.branch === "main"), []);
  const history = useMemo(() => {
    if (!startAt) return ["s01"];
    const index = main.findIndex((step) => step.id === startAt);
    return main.slice(0, Math.max(0, index)).map((step) => step.id);
  }, [main, startAt]);
  const [shown, setShown] = useState<string[]>(history);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reduced, setReduced] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const node = roomRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduce && entry.intersectionRatio >= 0.5) setRunning(true);
        if (entry.intersectionRatio < 0.2) setPaused(true);
        else if (entry.intersectionRatio >= 0.5) setPaused(false);
      },
      { threshold: [0, 0.2, 0.5, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running || reduced || alertOpen || decision) return;
    let frame = 0;
    const started = performance.now();
    const play = main.filter((step) => !history.includes(step.id) || step.id === startAt);
    const from = play[0]?.t_ms ?? 0;
    const loop = (now: number) => {
      if (pausedRef.current) {
        frame = requestAnimationFrame(loop);
        return;
      }
      const elapsed = from + (now - started);
      const due = main.filter((step) => step.t_ms <= elapsed && (startAt ? step.t_ms >= from || history.includes(step.id) : true));
      const ids = due.map((step) => step.id);
      setShown((current) => (current.join() === ids.join() ? current : ids));
      if (due.some((step) => step.ui_event === "alert.open")) {
        setAlertOpen(true);
        window.dispatchEvent(new CustomEvent("ob-overlay", { detail: true }));
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, reduced, alertOpen, decision, history, main, startAt]);

  useEffect(() => {
    if (!decision || reduced) return;
    let frame = 0;
    const steps = branchOf(decision);
    const started = performance.now();
    const loop = (now: number) => {
      const elapsed = now - started;
      const due = steps.filter((step) => step.t_ms <= elapsed).map((step) => step.id);
      setShown((current) => {
        const next = [...current.filter((id) => byId.get(id)?.branch === "main"), ...due];
        return current.join() === next.join() ? current : next;
      });
      if (due.length < steps.length) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [decision, reduced]);

  useEffect(() => {
    if (shown.includes("s15a") || shown.includes("s15b")) outcomeRef.current?.focus();
  }, [shown]);

  useEffect(() => {
    const node = roomRef.current;
    if (!node) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    let frame = 0;
    let lastPacket = 0;
    const onMove = (event: PointerEvent) => {
      if (alertOpen) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.querySelectorAll<HTMLElement>("[data-lean]").forEach((chip) => {
          const rect = chip.getBoundingClientRect();
          const dx = event.clientX - (rect.left + rect.width / 2);
          const dy = event.clientY - (rect.top + rect.height / 2);
          const dist = Math.hypot(dx, dy) || 1;
          const mag = Math.min(4, Math.max(0, 1 - dist / 240) * 4);
          chip.style.transform = `translate3d(${(dx / dist) * mag}px, ${(dy / dist) * mag}px, 0)`;
        });
      });
    };
    const onEnter = (event: Event) => {
      if (alertOpen) return;
      const now = performance.now();
      if (now - lastPacket < 600) return;
      lastPacket = now;
      const chip = (event.target as HTMLElement).closest<HTMLElement>("[data-lean]");
      if (!chip) return;
      const packet = node.querySelector<HTMLElement>("[data-packet]");
      if (!packet) return;
      const from = node.getBoundingClientRect();
      const to = chip.getBoundingClientRect();
      packet.style.transform = `translate3d(${to.left - from.left + to.width / 2}px, ${to.top - from.top + to.height / 2}px, 0)`;
    };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerover", onEnter);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerover", onEnter);
      cancelAnimationFrame(frame);
    };
  }, [alertOpen]);

  useEffect(() => {
    if (!alertOpen) {
      roomRef.current?.querySelectorAll<HTMLElement>("[data-lean]").forEach((chip) => {
        chip.style.transform = "translate3d(0, 0, 0)";
      });
    }
  }, [alertOpen]);

  const replayRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const onReplay = () => replayRef.current();
    window.addEventListener("ob-replay", onReplay);
    return () => window.removeEventListener("ob-replay", onReplay);
  }, []);

  function replay() {
    setShown(history);
    setAlertOpen(false);
    setDecision(null);
    setPaused(false);
    setRunning(!reduced);
    window.dispatchEvent(new CustomEvent("ob-overlay", { detail: false }));
  }
  replayRef.current = replay;

  function choose(kind: "approve" | "reject") {
    setDecision(kind);
    setAlertOpen(false);
    window.dispatchEvent(new CustomEvent("ob-overlay", { detail: false }));
    if (reduced) {
      const first = branchOf(kind)[0];
      if (first) setShown((current) => [...current, first.id]);
    }
  }

  function revealNext() {
    const order = [...main, ...branchOf(decision)];
    const upcoming = order.find((step) => !shown.includes(step.id));
    if (!upcoming) return;
    setShown((current) => [...current, upcoming.id]);
    if (upcoming.ui_event === "alert.open") {
      setAlertOpen(true);
      window.dispatchEvent(new CustomEvent("ob-overlay", { detail: true }));
    }
  }

  const price = shown.reduce<number | null>((current, id) => {
    const step = byId.get(id);
    if (!step) return current;
    if (step.ui_event === "ticker.set" || step.ui_event === "ticker.revert") return step.price;
    return current;
  }, null);
  const flagged = shown.some((id) => byId.get(id)?.ui_event === "policy_panel.flag_prepay");
  const outcome = shown.includes("s15a") ? "approved" : shown.includes("s15b") ? "rejected" : null;

  return (
    <div
      ref={roomRef}
      className="room"
      role="region"
      aria-label={copy("demo.label.aria_region")}
      onKeyDown={(event) => {
        if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          replay();
        }
      }}
    >
      <div className={alertOpen ? "room-frozen" : undefined} inert={alertOpen ? true : undefined}>
        <div className="room-top">
          <span className="badge">
            <span className="packet-dot" aria-hidden="true" />
            {copy("demo.label.badge")}
          </span>
          {alertOpen ? (
            <span className="badge">
              <PausePulse mode="dot" />
              {copy("demo.label.paused")}
            </span>
          ) : null}
          <button type="button" className="btn btn-text" onClick={() => setPaused((value) => !value)}>
            {paused ? copy("demo.label.resume") : copy("demo.label.pause")}
          </button>
          <button type="button" className="btn btn-text" aria-keyshortcuts="R" onClick={replay}>
            {copy("demo.label.replay")}
          </button>
          {reduced && !running ? (
            <button type="button" className="btn btn-secondary" onClick={() => setRunning(true)}>
              {copy("demo.label.start")}
            </button>
          ) : null}
          {reduced && running ? (
            <button type="button" className="btn btn-secondary" onClick={revealNext}>
              {copy("demo.label.next")}
            </button>
          ) : null}
        </div>
        <div className="room-body">
          <ol className="cast">
            <li data-lean="" className="cast-chip">
              <div>{copy("demo.cast.system.label")}</div>
              <div className="role">{copy("demo.cast.system.role")}</div>
            </li>
            <li data-company-chip="1" data-lean="" className="cast-chip">
              <div>{copy("demo.cast.buyer.label")}</div>
              <div className="company">{copy("demo.cast.buyer.company")}</div>
              <div className="role">{copy("demo.cast.buyer.role")}</div>
            </li>
            <li className="fictional">{copy("demo.label.fictional")}</li>
            {(["supplier_a", "supplier_b", "supplier_c"] as const).map((id) => (
              <li key={id} data-lean="" className="cast-chip">
                <div>{copy(LABEL[id]!)}</div>
                <div className="company">
                  {id === "supplier_a" ? copy("demo.cast.supplier_a.company") : null}
                  {id === "supplier_b" ? copy("demo.cast.supplier_b.company") : null}
                  {id === "supplier_c" ? copy("demo.cast.supplier_c.company") : null}
                </div>
                <div className="role">
                  {id === "supplier_a" ? copy("demo.cast.supplier_a.role") : null}
                  {id === "supplier_b" ? copy("demo.cast.supplier_b.role") : null}
                  {id === "supplier_c" ? copy("demo.cast.supplier_c.role") : null}
                </div>
                <div className="muted">
                  <span className="packet-dot" style={{ background: "var(--color-success)" }} aria-hidden="true" />{" "}
                  {copy("demo.label.verified")}
                </div>
              </li>
            ))}
            <li data-lean="" className="cast-chip">
              <div>{copy("demo.cast.approver.label")}</div>
              <div className="company">{copy("demo.cast.approver.company")}</div>
              <div className="role">{copy("demo.cast.approver.role")}</div>
            </li>
          </ol>
          <div>
            {shown.map((id) => {
              const step = byId.get(id);
              if (!step) return null;
              if (step.type === "system" || step.type === "alert") {
                return (
                  <p key={id} className="system-row">
                    {copy(TEXT[id]!)}
                  </p>
                );
              }
              const right = step.speaker === "buyer" || step.speaker === "approver";
              return (
                <div key={id} className={right ? "bubble right" : "bubble"}>
                  <div className="muted">{copy(LABEL[step.speaker]!)}</div>
                  <div>{copy(TEXT[id]!)}</div>
                  {step.type === "price_tick" && step.price != null ? <div className="price-line">{step.price}</div> : null}
                </div>
              );
            })}
            {outcome ? (
              <article className="panel" style={outcome === "approved" ? { borderColor: "var(--color-success)" } : undefined}>
                <h3 ref={outcomeRef} tabIndex={-1}>
                  {outcome === "approved" ? copy("demo.outcome.approved.heading") : copy("demo.outcome.rejected.heading")}
                </h3>
                <p>{outcome === "approved" ? copy("demo.outcome.approved.body") : copy("demo.outcome.rejected.body")}</p>
                <p className="type-mono">
                  {outcome === "approved" ? copy("demo.outcome.approved.record_ref") : copy("demo.outcome.rejected.record_ref")}
                </p>
              </article>
            ) : null}
            {reduced && shown.includes("s12") && !decision ? <p className="muted">{copy("demo.label.idle_hint")}</p> : null}
          </div>
          <div>
            <div className="ticker">
              <div className="muted">{copy("demo.label.ticker")}</div>
              <strong>{price == null ? "" : price}</strong>
            </div>
            <div className="panel" style={{ marginTop: 12 }}>
              <h3 className="type-h4">{copy("demo.label.policy_title")}</h3>
              <p>{copy("demo.label.policy_price")}</p>
              <p className={flagged ? "policy-row flagged" : "policy-row"}>{copy("demo.label.policy_prepay")}</p>
              <p>{copy("demo.label.policy_delivery")}</p>
            </div>
          </div>
        </div>
        <span data-packet="" aria-hidden="true" className="packet-dot" style={{ position: "absolute", left: "50%", top: "40%", transition: "transform 420ms var(--ease-inOut)" }} />
      </div>
      {alertOpen ? <PausePulse mode="sweep" /> : null}
      {alertOpen ? <RedAlertModal onReject={() => choose("reject")} onApprove={() => choose("approve")} /> : null}
      <p className="muted" style={{ padding: "0 16px 16px" }}>
        {copy("demo.label.disclaimer")}
      </p>
      {outcome ? (
        <p className="type-body-l" style={{ padding: "0 16px 16px" }}>
          {copy("demo.label.closing")}
        </p>
      ) : null}
      {captionKey ? (
        <p className="muted" style={{ padding: "0 16px 16px" }}>
          <T k={captionKey} />
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { copy } from "@/lib/copy";
import { T } from "@/components/ui/Copy";
import styles from "./RedAlertModal.module.css";

function Octagon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 1h8l5 5v8l-5 5H6l-5-5V6l5-5zm3 5v4h2V6H9zm0 6v2h2v-2H9z"
      />
    </svg>
  );
}

export function RedAlertModal({
  staticMode = false,
  onReject,
  onApprove,
}: {
  staticMode?: boolean;
  onReject?: () => void;
  onApprove?: () => void;
}) {
  const titleId = useId();
  const subtitleId = useId();
  const bodyId = useId();
  const rejectRef = useRef<HTMLButtonElement>(null);
  const approveRef = useRef<HTMLButtonElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (staticMode) return;
    rejectRef.current?.focus();
  }, [staticMode]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (staticMode) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      rejectRef.current?.focus();
      if (liveRef.current) liveRef.current.textContent = copy("demo.alert.sr_decision_required");
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = [rejectRef.current, approveRef.current].filter(Boolean) as HTMLButtonElement[];
    const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
    event.preventDefault();
    const next = event.shiftKey ? (index <= 0 ? nodes.length - 1 : index - 1) : (index + 1) % nodes.length;
    nodes[next]?.focus();
  }

  const body = (
    <>
      <div className={styles.title} id={titleId}>
        <Octagon />
        {copy("demo.alert.title")}
      </div>
      <h3 id={subtitleId}>{copy("demo.alert.subtitle")}</h3>
      <p id={bodyId} className="muted">
        <T k="demo.alert.body" />
      </p>
      <p className="muted">{copy("demo.alert.paused_line")}</p>
      <div className="panel">
        <p>
          {copy("demo.alert.row1.label")}: {copy("demo.alert.row1.value")} — {copy("demo.alert.row1.status")}
        </p>
        <p className={styles.breach}>
          {copy("demo.alert.row2.label")}: {copy("demo.alert.row2.value")} — {copy("demo.alert.row2.status")}
        </p>
        <p>
          {copy("demo.alert.row3.label")}: {copy("demo.alert.row3.value")} — {copy("demo.alert.row3.status")}
        </p>
      </div>
      <div className={styles.actions}>
        <button
          ref={rejectRef}
          type="button"
          className="btn btn-secondary"
          aria-hidden={staticMode || undefined}
          tabIndex={staticMode ? -1 : 0}
          onClick={onReject}
        >
          {copy("demo.alert.reject_label")}
        </button>
        <button
          ref={approveRef}
          type="button"
          className="btn btn-primary"
          aria-hidden={staticMode || undefined}
          tabIndex={staticMode ? -1 : 0}
          onClick={onApprove}
        >
          {copy("demo.alert.approve_label")}
        </button>
      </div>
      <p className="solid-meta">{copy("demo.label.disclaimer")}</p>
      <p ref={liveRef} className="sr-only" aria-live="polite" />
    </>
  );

  if (staticMode) {
    return (
      <div className={styles.modal} aria-hidden="true">
        {body}
      </div>
    );
  }

  return (
    <div className={styles.modal} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={`${subtitleId} ${bodyId}`} onKeyDown={onKeyDown}>
      {body}
    </div>
  );
}

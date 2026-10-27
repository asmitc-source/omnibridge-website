import styles from "./PausePulse.module.css";

export function PausePulse({ mode }: { mode: "dot" | "sweep" }) {
  if (mode === "dot") return <span className={styles.dot} aria-hidden="true" />;
  return <div className={styles.sweep} aria-hidden="true" />;
}

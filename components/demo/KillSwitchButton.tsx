import { copy } from "@/lib/copy";
import styles from "./KillSwitchButton.module.css";

export function KillSwitchButton() {
  return (
    <figure className={styles.figure} aria-label={copy("trust.alt.kill")}>
      <div className={styles.pill}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5l4-4z" />
        </svg>
        {copy("trust.kill.button_label")}
      </div>
      <figcaption className={styles.caption}>{copy("trust.kill.button_caption")}</figcaption>
    </figure>
  );
}

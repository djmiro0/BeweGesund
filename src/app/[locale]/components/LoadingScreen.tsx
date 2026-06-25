import styles from "./LoadingScreen.module.css";

interface LoadingScreenProps {
  label?: string;
  text?: string;
}

export default function LoadingScreen({ label = "BeweGesund", text }: LoadingScreenProps) {
  return (
    <main className={styles.loadingScreen} aria-busy="true" aria-live="polite">
      <div className={styles.loadingMark} aria-hidden="true" />
      <p className={styles.loadingKicker}>{label}</p>
      {text ? <p className={styles.loadingText}>{text}</p> : null}
    </main>
  );
}

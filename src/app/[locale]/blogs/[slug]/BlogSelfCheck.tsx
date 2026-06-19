"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import styles from "../Blogs.module.css";

interface BlogSelfCheckProps {
  locale: string;
}

const selfCheckCopy = {
  de: {
    eyebrow: "Selbsttest",
    title: "Kurzer Check-in",
    intro: "Wähle die Aussagen aus, die heute auf dich zutreffen. Das Ergebnis bleibt nur auf deinem Gerät.",
    options: [
      "Ich fühle mich gerade angespannt oder innerlich unruhig.",
      "Ich hatte heute wenig bewusste Pausen.",
      "Mein Körper fühlt sich schwer, müde oder verspannt an.",
      "Ich brauche einen kleinen Schritt, um wieder in Bewegung zu kommen.",
    ],
    action: "Ergebnis anzeigen",
    empty: "Wähle mindestens eine Aussage aus.",
    results: [
      "Dein Check-in wirkt ruhig. Eine kurze Atem- oder Dehnpause kann helfen, diesen Zustand zu stabilisieren.",
      "Du zeigst leichte Belastungszeichen. Plane eine kleine Regenerationspause oder eine sanfte Übungseinheit ein.",
      "Dein Körper sendet mehrere Stress- oder Spannungssignale. Starte niedrigschwellig: 60 Sekunden atmen, Wasser trinken und danach sanft bewegen.",
    ],
    note: "Dieser Selbsttest dient dem allgemeinen Wohlbefinden und ersetzt keine medizinische Diagnose.",
  },
  en: {
    eyebrow: "Self-check",
    title: "Quick check-in",
    intro: "Select the statements that fit today. The result stays on your device.",
    options: [
      "I feel tense or internally restless right now.",
      "I had few conscious breaks today.",
      "My body feels heavy, tired, or tight.",
      "I need a small step to get moving again.",
    ],
    action: "Show result",
    empty: "Select at least one statement.",
    results: [
      "Your check-in looks calm. A short breathing or stretching pause can help keep it steady.",
      "You show mild signs of load. Plan a small recovery break or a gentle movement session.",
      "Your body is showing several stress or tension signals. Start small: breathe for 60 seconds, drink water, then move gently.",
    ],
    note: "This self-check is for general well-being and does not replace medical diagnosis.",
  },
} as const;

export default function BlogSelfCheck({ locale }: BlogSelfCheckProps) {
  const copy = locale === "de" ? selfCheckCopy.de : selfCheckCopy.en;
  const [selected, setSelected] = useState<string[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!hasSubmitted) return "";
    if (selected.length === 0) return copy.empty;
    if (selected.length <= 1) return copy.results[0];
    if (selected.length <= 2) return copy.results[1];
    return copy.results[2];
  }, [copy, hasSubmitted, selected.length]);

  const toggleOption = (option: string) => {
    setSelected((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
    setHasSubmitted(false);
  };

  return (
    <section className={styles.selfCheck} aria-labelledby="blog-self-check-title">
      <p className={styles.selfCheckEyebrow}>{copy.eyebrow}</p>
      <h2 id="blog-self-check-title">{copy.title}</h2>
      <p>{copy.intro}</p>
      <div className={styles.selfCheckOptions}>
        {copy.options.map((option) => {
          const checked = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              className={`${styles.selfCheckOption} ${checked ? styles.selfCheckOptionActive : ""}`}
              onClick={() => toggleOption(option)}
              aria-pressed={checked}
            >
              <CheckCircle2 size={18} />
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.selfCheckAction}
        onClick={() => setHasSubmitted(true)}
      >
        {copy.action}
      </button>
      {hasSubmitted ? (
        <div className={styles.selfCheckResult} role="status">
          {result}
        </div>
      ) : null}
      <p className={styles.selfCheckNote}>{copy.note}</p>
    </section>
  );
}

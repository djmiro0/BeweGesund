"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Waves } from "lucide-react";
import styles from "../Relaxation.module.css";

interface BreathingTechnique {
  title: string;
  duration: string;
  description: string;
  steps: string[];
  music: string;
}

interface BreathingEducationItem {
  title: string;
  basis: string;
  howItWorks: string;
}

interface BreathingTechniquesProps {
  copy: {
    title: string;
    intro: string;
    musicNote: string;
    play: string;
    pause: string;
    education: {
      summary: string;
      title: string;
      intro: string;
      items: BreathingEducationItem[];
      disclaimerTitle: string;
      disclaimer: string;
    };
    sections: BreathingTechnique[];
  };
}

function createSoftPad(index: number) {
  const AudioContextConstructor = window.AudioContext
    || (window as Window & typeof globalThis & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextConstructor();
  const baseFrequency = [174, 196, 220, 246.94, 261.63][index] ?? 196;
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const oscillator = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();

  oscillator.type = "sine";
  oscillator.frequency.value = baseFrequency;
  overtone.type = "sine";
  overtone.frequency.value = baseFrequency * 1.5;
  filter.type = "lowpass";
  filter.frequency.value = 620;
  gain.gain.value = 0.03;

  oscillator.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  overtone.start();

  return {
    stop: () => {
      gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
      window.setTimeout(() => audioContext.close().catch(() => undefined), 220);
    },
  };
}

export default function BreathingTechniques({ copy }: BreathingTechniquesProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const soundRef = useRef<ReturnType<typeof createSoftPad> | null>(null);

  const stop = () => {
    soundRef.current?.stop();
    soundRef.current = null;
    setActiveIndex(null);
  };

  const play = (index: number) => {
    stop();
    soundRef.current = createSoftPad(index);
    setActiveIndex(index);
  };

  useEffect(() => () => {
    soundRef.current?.stop();
  }, []);

  return (
    <section className={styles.breathingSection} aria-labelledby="breathing-techniques-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>{copy.musicNote}</p>
          <h2 id="breathing-techniques-title">{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
      </div>

      <details className={styles.breathingInfo}>
        <summary>{copy.education.summary}</summary>
        <div className={styles.breathingInfoBody}>
          <div className={styles.breathingInfoIntro}>
            <h3>{copy.education.title}</h3>
            <p>{copy.education.intro}</p>
          </div>
          <div className={styles.breathingInfoGrid}>
            {copy.education.items.map((item) => (
              <article key={item.title}>
                <h4>{item.title}</h4>
                <p><strong>{item.basis}</strong></p>
                <p>{item.howItWorks}</p>
              </article>
            ))}
          </div>
          <div className={styles.breathingDisclaimer}>
            <strong>{copy.education.disclaimerTitle}</strong>
            <p>{copy.education.disclaimer}</p>
          </div>
        </div>
      </details>

      <div className={styles.breathingGrid}>
        {copy.sections.map((section, index) => {
          const isActive = activeIndex === index;

          return (
            <article key={section.title} className={`${styles.breathingCard} ${isActive ? styles.breathingCardActive : ""}`}>
              <div className={styles.breathingCardHead}>
                <span>
                  <Waves size={17} />
                  {section.duration}
                </span>
                <button type="button" onClick={() => (isActive ? stop() : play(index))}>
                  {isActive ? <Pause size={15} /> : <Play size={15} />}
                  {isActive ? copy.pause : copy.play}
                </button>
              </div>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <ol>
                {section.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <p className={styles.musicCue}>{section.music}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

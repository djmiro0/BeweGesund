"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Info, Pause, Play, Volume2, VolumeX, Waves, Wind, X } from "lucide-react";
import styles from "../Relaxation.module.css";

interface BreathingTechnique {
  title: string;
  duration: string;
  description: string;
  steps: string[];
  rhythm: string[];
  animation: string;
  music: string[];
  note?: string;
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
    open: string;
    close: string;
    inhale: string;
    exhale: string;
    hold: string;
    rest: string;
    rhythmLabel: string;
    animationLabel: string;
    musicLabel: string;
    instructionLabel: string;
    musicOnLabel: string;
    musicOffLabel: string;
    breathSoundOnLabel: string;
    breathSoundOffLabel: string;
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

const breathingPatterns = [
  [
    { key: "inhale", seconds: 4, scale: 1.16 },
    { key: "exhale", seconds: 6, scale: 0.72 },
  ],
  [
    { key: "inhale", seconds: 5, scale: 1.24 },
    { key: "exhale", seconds: 5, scale: 0.76 },
  ],
  [
    { key: "inhale", seconds: 4, scale: 1.16 },
    { key: "hold", seconds: 4, scale: 1.16 },
    { key: "exhale", seconds: 4, scale: 0.78 },
    { key: "hold", seconds: 4, scale: 0.78 },
  ],
  [
    { key: "inhale", seconds: 4, scale: 1.12 },
    { key: "hold", seconds: 7, scale: 1.12 },
    { key: "exhale", seconds: 8, scale: 0.7 },
  ],
  [
    { key: "inhale", seconds: 5, scale: 1.18 },
    { key: "exhale", seconds: 5, scale: 0.76 },
  ],
] as const;

type BreathPhase = (typeof breathingPatterns)[number][number];
type SoftPad = ReturnType<typeof createSoftPad>;

function getBreathingVisualClass(index: number) {
  if (index === 0) return styles.breathingVisualForest;
  if (index === 1) return styles.breathingVisualWave;
  if (index === 2) return styles.breathingVisualBox;
  if (index === 3) return styles.breathingVisualNight;
  return styles.breathingVisualCoherent;
}

function createNoiseBuffer(audioContext: AudioContext, seconds = 2) {
  const bufferSize = Math.floor(audioContext.sampleRate * seconds);
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  for (let index = 0; index < bufferSize; index += 1) {
    output[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function createSoftPad(index: number, musicEnabled = true, musicLabel = "") {
  const AudioContextConstructor = window.AudioContext
    || (window as Window & typeof globalThis & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextConstructor();
  const baseFrequency = [174, 196, 220, 246.94, 261.63][index] ?? 196;
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const oscillator = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();
  const lowerMusicLabel = musicLabel.toLowerCase();
  const usesNoiseBed = /rain|regen|ocean|welle|wave|wald|forest|wind|natur|nature|cricket|grille|white noise|rauschen/.test(lowerMusicLabel);
  const noiseSource = usesNoiseBed ? audioContext.createBufferSource() : null;
  const noiseFilter = usesNoiseBed ? audioContext.createBiquadFilter() : null;

  oscillator.type = "sine";
  oscillator.frequency.value = baseFrequency;
  overtone.type = lowerMusicLabel.includes("piano") || lowerMusicLabel.includes("klavier") ? "triangle" : "sine";
  overtone.frequency.value = baseFrequency * (lowerMusicLabel.includes("piano") || lowerMusicLabel.includes("klavier") ? 2 : 1.5);
  filter.type = "lowpass";
  filter.frequency.value = lowerMusicLabel.includes("piano") || lowerMusicLabel.includes("klavier") ? 980 : 620;
  gain.gain.value = musicEnabled ? 0.03 : 0;

  oscillator.connect(filter);
  overtone.connect(filter);

  if (noiseSource && noiseFilter) {
    noiseSource.buffer = createNoiseBuffer(audioContext);
    noiseSource.loop = true;
    noiseFilter.type = lowerMusicLabel.includes("rain") || lowerMusicLabel.includes("regen") || lowerMusicLabel.includes("rauschen")
      ? "highpass"
      : "lowpass";
    noiseFilter.frequency.value = lowerMusicLabel.includes("rain") || lowerMusicLabel.includes("regen")
      ? 1550
      : lowerMusicLabel.includes("wind")
        ? 420
        : 720;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(filter);
  }

  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  overtone.start();
  noiseSource?.start();

  return {
    playBreathCue: (phase: BreathPhase, secondsOverride?: number) => {
      if (phase.key === "hold") return;

      const now = audioContext.currentTime;
      const seconds = Math.max(0.45, (secondsOverride ?? phase.seconds) - 0.12);
      const bufferSize = Math.floor(audioContext.sampleRate * seconds);
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      const breathGain = audioContext.createGain();
      const breathFilter = audioContext.createBiquadFilter();
      const source = audioContext.createBufferSource();

      for (let index = 0; index < bufferSize; index += 1) {
        output[index] = (Math.random() * 2 - 1) * 0.42;
      }

      breathFilter.type = phase.key === "inhale" ? "bandpass" : "lowpass";
      breathFilter.frequency.setValueAtTime(phase.key === "inhale" ? 960 : 520, now);
      breathFilter.Q.value = phase.key === "inhale" ? 0.8 : 0.55;
      breathGain.gain.setValueAtTime(0.0001, now);
      breathGain.gain.linearRampToValueAtTime(phase.key === "inhale" ? 0.09 : 0.13, now + Math.min(1, seconds * 0.35));
      breathGain.gain.linearRampToValueAtTime(0.0001, now + seconds);

      source.buffer = noiseBuffer;
      source.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(audioContext.destination);
      source.start(now);
      source.stop(now + seconds);
    },
    setMusicEnabled: (enabled: boolean) => {
      gain.gain.setTargetAtTime(enabled ? 0.03 : 0, audioContext.currentTime, 0.08);
    },
    stop: () => {
      gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
      window.setTimeout(() => audioContext.close().catch(() => undefined), 220);
    },
  };
}

export default function BreathingTechniques({ copy }: BreathingTechniquesProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isBreathCueEnabled, setIsBreathCueEnabled] = useState(true);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);
  const [selectedMusicIndex, setSelectedMusicIndex] = useState(0);
  const soundRef = useRef<SoftPad | null>(null);
  const remainingSecondsRef = useRef(0);

  const stopMusic = () => {
    soundRef.current?.stop();
    soundRef.current = null;
  };

  const close = () => {
    stopMusic();
    setActiveIndex(null);
    setPhaseIndex(0);
    remainingSecondsRef.current = 0;
    setRemainingSeconds(0);
    setIsSessionRunning(false);
  };

  const open = (index: number) => {
    stopMusic();
    soundRef.current = createSoftPad(index, true, copy.sections[index]?.music[0] ?? "");
    setActiveIndex(index);
    setPhaseIndex(0);
    setIsMusicEnabled(true);
    setIsBreathCueEnabled(true);
    setSelectedMusicIndex(0);
    remainingSecondsRef.current = breathingPatterns[index]?.[0]?.seconds ?? 0;
    setRemainingSeconds(remainingSecondsRef.current);
    setIsSessionRunning(true);
  };

  const toggleSession = () => {
    if (activeIndex === null) return;

    if (isSessionRunning) {
      stopMusic();
      setIsSessionRunning(false);
      return;
    }

    soundRef.current = createSoftPad(activeIndex, isMusicEnabled, activeSection?.music[selectedMusicIndex] ?? "");
    setIsSessionRunning(true);
  };

  const selectMusic = (musicIndex: number) => {
    if (!activeSection || activeIndex === null) return;

    setSelectedMusicIndex(musicIndex);
    if (!isSessionRunning) return;

    stopMusic();
    soundRef.current = createSoftPad(activeIndex, isMusicEnabled, activeSection.music[musicIndex] ?? "");
  };

  const toggleMusic = () => {
    const next = !isMusicEnabled;
    soundRef.current?.setMusicEnabled(next);
    setIsMusicEnabled(next);
  };

  const toggleBreathCue = () => {
    setIsBreathCueEnabled((current) => !current);
  };

  useEffect(() => () => {
    soundRef.current?.stop();
  }, []);

  useEffect(() => {
    if (activeIndex === null || !isSessionRunning) return undefined;

    const pattern = breathingPatterns[activeIndex] ?? breathingPatterns[0];
    const phase = pattern[phaseIndex] ?? pattern[0];
    const phaseSeconds = remainingSecondsRef.current > 0 ? remainingSecondsRef.current : phase.seconds;
    if (isBreathCueEnabled) {
      soundRef.current?.playBreathCue(phase, phaseSeconds);
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        const next = Math.max(current - 1, 0);
        remainingSecondsRef.current = next;
        return next;
      });
    }, 1000);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setPhaseIndex((current) => {
        const nextIndex = (current + 1) % pattern.length;
        remainingSecondsRef.current = pattern[nextIndex]?.seconds ?? 0;
        setRemainingSeconds(remainingSecondsRef.current);
        return nextIndex;
      });
    }, phaseSeconds * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [activeIndex, isBreathCueEnabled, isSessionRunning, phaseIndex]);

  const activeSection = activeIndex === null ? null : copy.sections[activeIndex];
  const activeVisualIndex = activeIndex ?? 0;
  const activePattern = activeIndex === null ? breathingPatterns[0] : breathingPatterns[activeIndex] ?? breathingPatterns[0];
  const activePhase: BreathPhase = activePattern[phaseIndex] ?? activePattern[0];
  const phaseLabel = activePhase.key === "inhale"
    ? copy.inhale
    : activePhase.key === "exhale"
      ? copy.exhale
      : activePhase.key === "hold"
        ? copy.hold
        : copy.rest;

  return (
    <section className={styles.breathingSection} aria-label={copy.title}>
      <div className={styles.breathingLayout} aria-labelledby="breathing-education-title">
        <aside className={styles.breathingInfo}>
          <div className={styles.breathingInfoIntro}>
            <p className={styles.eyebrow}>{copy.education.summary}</p>
            <h3 id="breathing-education-title">{copy.education.title}</h3>
            <p>{copy.education.intro}</p>
          </div>
          <div className={styles.breathingDisclaimer}>
            <strong>{copy.education.disclaimerTitle}</strong>
            <p>{copy.education.disclaimer}</p>
          </div>
        </aside>

        <div className={styles.breathingPairList}>
          {copy.sections.map((section, index) => {
            const isActive = activeIndex === index;

            return (
              <article key={section.title} className={`${styles.breathingCard} ${isActive ? styles.breathingCardActive : ""}`}>
                <div className={styles.breathingCardHead}>
                  <span>
                    <Waves size={17} />
                    {section.duration}
                  </span>
                  <div className={styles.breathingCardActions}>
                    <button
                      type="button"
                      className={styles.breathingInfoButton}
                      onClick={() => setInfoIndex(index)}
                      aria-label={copy.education.summary}
                    >
                      <Info size={16} />
                    </button>
                    <button type="button" onClick={() => open(index)}>
                      <Play size={15} />
                      {copy.open}
                    </button>
                  </div>
                </div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      {infoIndex !== null && copy.education.items[infoIndex] ? (
        <div className={styles.breathingInfoPopupBackdrop} onClick={() => setInfoIndex(null)}>
          <article
            className={styles.breathingInfoPopup}
            role="dialog"
            aria-modal="true"
            aria-labelledby="breathing-info-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className={styles.breathingInfoPopupClose} onClick={() => setInfoIndex(null)} aria-label={copy.close}>
              <X size={18} />
            </button>
            <p className={styles.eyebrow}>{copy.education.summary}</p>
            <h3 id="breathing-info-popup-title">{copy.education.items[infoIndex].title}</h3>
            <p><strong>{copy.education.items[infoIndex].basis}</strong></p>
            <p>{copy.education.items[infoIndex].howItWorks}</p>
          </article>
        </div>
      ) : null}

      {activeSection ? (
        <div className={styles.breathingSessionOverlay} role="dialog" aria-modal="true" aria-labelledby="breathing-session-title">
          <button type="button" className={styles.breathingSessionClose} onClick={close} aria-label={copy.close}>
            <X size={19} />
          </button>

          <div className={styles.breathingSessionCopy}>
            <p className={styles.eyebrow}>{activeSection.duration}</p>
            <h3 id="breathing-session-title">{activeSection.title}</h3>
            <p>{activeSection.description}</p>
          </div>

          <div className={styles.breathingOrbPanel}>
            <div className={styles.breathingOrbWrap} aria-live="polite">
              <div
                className={`${styles.breathingOrb} ${getBreathingVisualClass(activeVisualIndex)}`}
                style={{
                  "--breath-scale": activePhase.scale,
                  "--breath-duration": `${activePhase.seconds}s`,
                  "--breath-play-state": isSessionRunning ? "running" : "paused",
                } as CSSProperties}
              >
                <span>{phaseLabel}</span>
                <strong>{remainingSeconds || activePhase.seconds}s</strong>
              </div>
            </div>
            <button
              type="button"
              className={`${styles.breathingSessionToggle} ${isSessionRunning ? styles.musicStopButton : styles.musicPlayButton}`}
              onClick={toggleSession}
            >
              {isSessionRunning ? <Pause size={15} /> : <Play size={15} />}
              {isSessionRunning ? copy.pause : copy.play}
            </button>
            <div className={styles.breathingAudioToggles} aria-label={copy.musicLabel}>
              <button
                type="button"
                className={`${styles.breathingIconToggle} ${isMusicEnabled ? styles.breathingIconToggleActive : styles.breathingIconToggleMuted}`}
                onClick={toggleMusic}
                aria-label={isMusicEnabled ? copy.musicOnLabel : copy.musicOffLabel}
                title={isMusicEnabled ? copy.musicOnLabel : copy.musicOffLabel}
              >
                {isMusicEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                type="button"
                className={`${styles.breathingIconToggle} ${styles.breathingWindToggle} ${isBreathCueEnabled ? styles.breathingIconToggleActive : styles.breathingIconToggleMuted}`}
                onClick={toggleBreathCue}
                aria-label={isBreathCueEnabled ? copy.breathSoundOnLabel : copy.breathSoundOffLabel}
                title={isBreathCueEnabled ? copy.breathSoundOnLabel : copy.breathSoundOffLabel}
              >
                <Wind size={18} />
              </button>
            </div>
            <div className={styles.breathingMusicChoices} aria-label={copy.musicLabel}>
              {activeSection.music.map((music, musicIndex) => {
                const isSelected = selectedMusicIndex === musicIndex;

                return (
                  <button
                    key={`${music}-${musicIndex}`}
                    type="button"
                    className={isSelected ? styles.breathingMusicChoiceActive : ""}
                    onClick={() => selectMusic(musicIndex)}
                    aria-pressed={isSelected}
                  >
                    {music}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.breathingSessionDetails}>
            <div className={styles.breathingSessionMetaGrid}>
              <section>
                <h4>{copy.rhythmLabel}</h4>
                <ul>
                  {activeSection.rhythm.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
                </ul>
              </section>
              <section>
                <h4>{copy.animationLabel}</h4>
                <p>{activeSection.animation}</p>
              </section>
              <section>
                <h4>{copy.musicLabel}</h4>
                <ul>
                  {activeSection.music.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
                </ul>
              </section>
            </div>
            <h4>{copy.instructionLabel}</h4>
            <ol>
              {activeSection.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            {activeSection.note ? <p className={styles.musicCue}>{activeSection.note}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

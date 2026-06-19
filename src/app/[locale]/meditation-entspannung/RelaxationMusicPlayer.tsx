"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./Relaxation.module.css";

const durations = [5, 10, 20, 30];

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function RelaxationMusicPlayer() {
  const t = useTranslations("relaxation.musicPlayer");
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const stopAudio = () => {
    oscillatorsRef.current.forEach((oscillator) => oscillator.stop());
    oscillatorsRef.current = [];
    gainRef.current?.disconnect();
    gainRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
  };

  const startAudio = () => {
    stopAudio();

    const audioWindow = window as AudioWindow;
    const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, audioContext.currentTime + 1.4);
    gain.connect(audioContext.destination);

    const oscillators = [174, 261.63, 329.63].map((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.detune.setValueAtTime(index * 4, audioContext.currentTime);
      oscillator.connect(gain);
      oscillator.start();
      return oscillator;
    });

    audioContextRef.current = audioContext;
    gainRef.current = gain;
    oscillatorsRef.current = oscillators;
  };

  useEffect(() => {
    if (!isPlaying) return undefined;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setIsPlaying(false);
          stopAudio();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isPlaying]);

  useEffect(() => () => stopAudio(), []);

  const openSession = (minutes: number) => {
    stopAudio();
    setSelectedMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!selectedMinutes) return;

    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
      return;
    }

    startAudio();
    setIsPlaying(true);
  };

  const closeSession = () => {
    stopAudio();
    setIsPlaying(false);
    setSelectedMinutes(null);
    setRemainingSeconds(0);
  };

  return (
    <>
      <div className={styles.durationRail} aria-label={t("durationAria")}>
        {durations.map((minutes) => (
          <button key={minutes} type="button" onClick={() => openSession(minutes)}>
            {t("durationOption", { minutes })}
          </button>
        ))}
      </div>

      {selectedMinutes ? (
        <div className={styles.musicPlayerOverlay}>
          <section className={styles.musicPlayer} role="dialog" aria-modal="true" aria-labelledby="relaxation-player-title">
            <button type="button" className={styles.playerClose} aria-label={t("close")} onClick={closeSession}>
              <X size={20} />
            </button>
            <p className={styles.eyebrow}>{t("title")}</p>
            <h3 id="relaxation-player-title">
              {t("session", { minutes: selectedMinutes })}
            </h3>
            <div className={`${styles.playerOrb} ${isPlaying ? styles.playerOrbActive : ""}`} aria-hidden="true" />
            <strong className={styles.playerTime}>{formatTime(remainingSeconds)}</strong>
            <button type="button" className={styles.playerButton} onClick={togglePlayback}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? t("pause") : t("play")}
            </button>
            <p className={styles.playerNote}>{t("generated")}</p>
          </section>
        </div>
      ) : null}
    </>
  );
}

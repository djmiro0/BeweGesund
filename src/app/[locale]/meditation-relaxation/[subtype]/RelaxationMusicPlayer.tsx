"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";
import styles from "../Relaxation.module.css";

interface MusicOption {
  minutes: number;
  title: string;
  description: string;
  benefits: string[];
  bestFor: string;
}

interface RelaxationMusicPlayerProps {
  copy: {
    title: string;
    play: string;
    pause: string;
    playAll: string;
    stopAll: string;
    generated: string;
    session: string;
    options: MusicOption[];
  };
}

function createAmbientSound() {
  const AudioContextConstructor =
    window.AudioContext ||
    (
      window as Window &
        typeof globalThis & { webkitAudioContext: typeof AudioContext }
    ).webkitAudioContext;
  const audioContext = new AudioContextConstructor();
  const output = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const primary = audioContext.createOscillator();
  const secondary = audioContext.createOscillator();

  primary.type = "sine";
  primary.frequency.value = 174;
  secondary.type = "triangle";
  secondary.frequency.value = 261.63;
  filter.type = "lowpass";
  filter.frequency.value = 760;
  output.gain.value = 0.035;

  primary.connect(filter);
  secondary.connect(filter);
  filter.connect(output);
  output.connect(audioContext.destination);
  primary.start();
  secondary.start();

  return {
    stop: () => {
      output.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
      window.setTimeout(() => audioContext.close().catch(() => undefined), 220);
    },
  };
}

export default function RelaxationMusicPlayer({
  copy,
}: RelaxationMusicPlayerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playAll, setPlayAll] = useState(false);
  const soundRef = useRef<ReturnType<typeof createAmbientSound> | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopSound = () => {
    soundRef.current?.stop();
    soundRef.current = null;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const stop = () => {
    stopSound();
    setActiveIndex(null);
    setPlayAll(false);
  };

  const play = async (index: number, shouldContinue = false) => {
    stopSound();
    soundRef.current = createAmbientSound();
    setActiveIndex(index);
    setPlayAll(shouldContinue);

    const durationMs = copy.options[index].minutes * 60 * 1000;
    timerRef.current = window.setTimeout(() => {
      if (shouldContinue && index < copy.options.length - 1) {
        void play(index + 1, true);
      } else {
        stop();
      }
    }, durationMs);
  };

  useEffect(
    () => () => {
      soundRef.current?.stop();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <section
      className={styles.musicPlayer}
      aria-labelledby="relaxation-music-player"
    >
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>{copy.generated}</p>
          <h2 id="relaxation-music-player">{copy.title}</h2>
        </div>
        <button
          type="button"
          className={styles.primaryAudioButton}
          onClick={() => (playAll ? stop() : play(0, true))}
        >
          {playAll ? <Pause size={18} /> : <SkipForward size={18} />}
          {playAll ? copy.stopAll : copy.playAll}
        </button>
      </div>

      <div className={styles.musicTrackGrid}>
        {copy.options.map((option, index) => {
          const isActive = activeIndex === index;

          return (
            <article
              key={option.minutes}
              className={`${styles.musicTrack} ${isActive ? styles.musicTrackActive : ""}`}
            >
              <div>
                <span>
                  {copy.session.replace("{minutes}", String(option.minutes))}
                </span>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
              <ul>
                {option.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <p className={styles.bestFor}>{option.bestFor}</p>
              <button
                type="button"
                onClick={() => (isActive ? stop() : play(index))}
              >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
                {isActive ? copy.pause : copy.play}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

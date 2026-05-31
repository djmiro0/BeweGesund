// components/VideoSection.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useLocale } from "next-intl";
import type { TrainingVideo } from "@/lib/contentful";

export default function VideoSection() {
    const locale = useLocale();
    const [videos, setVideos] = useState<TrainingVideo[]>([]);

    useEffect(() => {
        let cancelled = false;

        void fetch(`/api/content/videos?locale=${locale}`)
            .then((response) => response.json())
            .then((payload: { videos?: TrainingVideo[] }) => {
                if (!cancelled) setVideos(payload.videos ?? []);
            })
            .catch(() => {
                if (!cancelled) setVideos([]);
            });

        return () => {
            cancelled = true;
        };
    }, [locale]);

    useEffect(() => {
        if (!videos.some((video) => video.muxPlaybackId)) return;
        if (document.querySelector('script[data-mux-player="true"]')) return;

        const script = document.createElement("script");
        script.type = "module";
        script.src = "https://cdn.jsdelivr.net/npm/@mux/mux-player";
        script.dataset.muxPlayer = "true";
        document.head.appendChild(script);
    }, [videos]);

    if (!videos.length) return null;

    return (
        <section id="videos" className="py-20 px-6 bg-[var(--background)]">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-12 text-[var(--text-light)]">
                    Online <span className="text-[var(--highlight)]">Training</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <motion.div
                            key={video.id}
                            whileHover={{ y: -5 }}
                            className="group relative rounded-2xl overflow-hidden aspect-video bg-[var(--surface-1)] border border-[rgba(var(--foreground-rgb),0.06)]"
                        >
                            {video.muxPlaybackId ? (
                                createMuxPlayer(video)
                            ) : (
                                <>
                                    <Image
                                        src={video.image}
                                        alt={video.title}
                                        fill
                                        sizes="(min-width: 768px) 33vw, 100vw"
                                        className="object-cover opacity-60 group-hover:opacity-40 transition"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 bg-[var(--button-primary-bg)] rounded-full flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition">
                                            <Play fill="var(--text-light)" className="text-[var(--text-light)]" />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="pointer-events-none absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-[rgba(var(--navy-rgb),0.95)] to-transparent">
                                <h3 className="text-xl font-bold uppercase italic text-[var(--text-light)]">{video.title}</h3>
                                <div className="flex gap-3 text-xs font-bold uppercase tracking-wider text-[var(--highlight-soft)] mt-1">
                                    {video.duration ? <span>{video.duration}</span> : null}
                                    {video.duration && video.level ? <span>•</span> : null}
                                    {video.level ? <span>{video.level}</span> : null}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function createMuxPlayer(video: TrainingVideo) {
    return (
        <mux-player
            playback-id={video.muxPlaybackId ?? undefined}
            poster={video.image || undefined}
            metadata-video-title={video.title}
            stream-type="on-demand"
            style={{ width: "100%", height: "100%" }}
        />
    );
}

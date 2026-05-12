// components/VideoSection.tsx
"use client";
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { mockVideos } from '@/data';

export default function VideoSection() {
    return (
        <section id="videos" className="py-20 px-6 bg-[var(--background)]">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-12 text-[var(--text-light)]">
                    Online <span className="text-[var(--highlight)]">Training</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mockVideos.map((video) => (
                        <motion.div
                            key={video.id}
                            whileHover={{ y: -5 }}
                            className="group relative rounded-2xl overflow-hidden aspect-video bg-[var(--surface-1)] cursor-pointer border border-[rgba(var(--foreground-rgb),0.06)]"
                        >
                            <img src={video.image} alt={video.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-[var(--button-primary-bg)] rounded-full flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition">
                                    <Play fill="var(--text-light)" className="text-[var(--text-light)]" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-[rgba(var(--navy-rgb),0.95)] to-transparent">
                                <h3 className="text-xl font-bold uppercase italic text-[var(--text-light)]">{video.title}</h3>
                                <div className="flex gap-3 text-xs font-bold uppercase tracking-wider text-[var(--highlight-soft)] mt-1">
                                    <span>{video.duration}</span>
                                    <span>•</span>
                                    <span>{video.level}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

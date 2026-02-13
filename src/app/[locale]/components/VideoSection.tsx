// components/VideoSection.tsx
"use client";
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { mockVideos } from '@/data';

export default function VideoSection() {
    return (
        <section id="videos" className="py-20 px-6 bg-zinc-950">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-12 text-white">
                    Online <span className="text-orange-500">Training</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mockVideos.map((video) => (
                        <motion.div
                            key={video.id}
                            whileHover={{ y: -5 }}
                            className="group relative rounded-2xl overflow-hidden aspect-video bg-zinc-900 cursor-pointer border border-white/5"
                        >
                            <img src={video.image} alt={video.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition">
                                    <Play fill="white" className="text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black to-transparent">
                                <h3 className="text-xl font-bold uppercase italic text-white">{video.title}</h3>
                                <div className="flex gap-3 text-xs font-bold uppercase tracking-wider text-orange-400 mt-1">
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
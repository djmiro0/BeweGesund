"use client";

import { ArrowRight, CircleCheck, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import styles from "./ComingSoon.module.css";

interface ComingSoonProps {
    openAuth: () => void;
}

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] } },
};

export default function ComingSoon({ openAuth }: ComingSoonProps) {
    return (
        <main className={styles.comingSoon}>
            <motion.section
                className={styles.hero}
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08 } },
                }}
            >
                <div className={styles.heroMedia} aria-hidden="true">
                    <motion.div className={styles.orbit} animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} />
                    <motion.div
                        className={styles.pulseLine}
                        animate={{ scaleX: [0.65, 1, 0.65], opacity: [0.48, 1, 0.48] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                <div className={styles.heroCopy}>
                    <motion.p className={styles.eyebrow} variants={fadeIn}>
                        BeweGesund
                    </motion.p>
                    <motion.h1 className={styles.title} variants={fadeIn}>
                        Website in Vorbereitung
                    </motion.h1>
                    <motion.p className={styles.description} variants={fadeIn}>
                        Wir bauen gerade eine moderne Plattform für Bewegung, Prävention und digitale Trainingsbegleitung.
                    </motion.p>
                    <motion.div className={styles.actions} variants={fadeIn}>
                        <button type="button" className={styles.primaryButton} onClick={openAuth}>
                            Member Login
                            <ArrowRight size={16} />
                        </button>
                        <span className={styles.statusPill}>
                            <Sparkles size={15} />
                            Launch Phase
                        </span>
                    </motion.div>
                </div>

                <motion.div className={styles.statusRail} variants={fadeIn}>
                    <div className={styles.statusItem}>
                        <CircleCheck size={18} />
                        <span>Konzept steht</span>
                    </div>
                    <div className={styles.statusItem}>
                        <Clock3 size={18} />
                        <span>Inhalte werden finalisiert</span>
                    </div>
                    <div className={styles.statusItem}>
                        <LockKeyhole size={18} />
                        <span>Öffentlicher Zugang folgt</span>
                    </div>
                </motion.div>
            </motion.section>
        </main>
    );
}

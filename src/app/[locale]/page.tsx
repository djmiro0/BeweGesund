"use client";
import React, { useState, useEffect } from 'react';
import { auth} from "../../../firebase.config";
import { onAuthStateChanged, User } from 'firebase/auth';

import AuthModal from './components/AuthModal';
import Dashboard from "./components/Dashboard";
import VideoSection from './components/VideoSection';
import LiveSchedule from './components/LiveSchedule';
import Services from './components/Services';
import HeroSection from "./components/HeroSection";
import {user} from '../../data'

export default function HomePage() {
    // const [user, setUser] = useState<User | null>(null);
    const [isAuthOpen, setAuthOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="bg-black h-screen flex items-center justify-center text-orange-500 font-bold">LADEN...</div>;
const test = "true";
    return (
        <div className="bg-zinc-950 text-white min-h-screen">
            <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />

            <main>
                {test ? (
                    // PRIVATNI DEO (Samo za članove)
                    <>
                        <Dashboard user={user} />
                        <VideoSection />
                        <LiveSchedule />
                        <Services />
                    </>
                ) : (
                    // JAVNI DEO (Marketing)
                    <HeroSection openAuth={() => setAuthOpen(true)} />
                )}
            </main>
        </div>
    );
}

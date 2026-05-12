"use client";
import { auth} from "../../../../firebase.config";
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

interface NavbarProps {
    user?: { email?: string } | null;
    openAuth?: () => void;
}

export default function Navbar({ user, openAuth }: NavbarProps) {
    return (
        <nav className="fixed w-full z-40 bg-[rgba(var(--navy-rgb),0.92)] border-b border-[var(--border-soft)] h-20 px-6 flex items-center justify-between">
            <div className="text-2xl font-black text-[var(--highlight)] italic">S.BeweGesund</div>

            <div className="flex items-center gap-6">
                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="hidden md:block text-sm font-bold text-[var(--text-muted)]">{user.email}</span>
                        <button onClick={() => signOut(auth)} className="text-[var(--highlight-strong)] flex items-center gap-2 text-sm font-bold uppercase">
                            <LogOut size={18} /> <span className="hidden md:block">Abmelden</span>
                        </button>
                    </div>
                ) : (
                    <button onClick={openAuth} className="bg-[var(--text-light)] text-[var(--text-on-warm)] px-6 py-2 font-black uppercase text-sm skew-x-[-10deg]">
                        <span className="inline-block skew-x-[10deg]">Anmelden</span>
                    </button>
                )}
            </div>
        </nav>
    );
}

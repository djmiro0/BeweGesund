"use client";
import { auth} from "../../../../firebase.config";
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

export default function Navbar({ user, openAuth }: any) {
    return (
        <nav className="fixed w-full z-40 bg-black/90 border-b border-white/10 h-20 px-6 flex items-center justify-between">
            <div className="text-2xl font-black text-orange-500 italic">S.BeweGesund</div>

            <div className="flex items-center gap-6">
                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="hidden md:block text-sm font-bold text-zinc-400">{user.email}</span>
                        <button onClick={() => signOut(auth)} className="text-red-500 flex items-center gap-2 text-sm font-bold uppercase">
                            <LogOut size={18} /> <span className="hidden md:block">Abmelden</span>
                        </button>
                    </div>
                ) : (
                    <button onClick={openAuth} className="bg-white text-black px-6 py-2 font-black uppercase text-sm skew-x-[-10deg]">
                        <span className="inline-block skew-x-[10deg]">Anmelden</span>
                    </button>
                )}
            </div>
        </nav>
    );
}
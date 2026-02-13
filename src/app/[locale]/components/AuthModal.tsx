"use client";
import { useState } from 'react';
import { auth} from "../../../../firebase.config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (error: any) {
            alert("Fehler: " + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md border border-white/10 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500"><X /></button>
                <h2 className="text-3xl font-black italic uppercase mb-6">
                    {isRegister ? 'Registrieren' : 'Anmelden'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-black border border-white/10 rounded-lg outline-none focus:border-orange-500"
                    />
                    <input
                        type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-black border border-white/10 rounded-lg outline-none focus:border-orange-500"
                    />
                    <button className="w-full py-4 bg-orange-600 font-bold uppercase rounded-lg">
                        {isRegister ? 'Konto erstellen' : 'Einloggen'}
                    </button>
                </form>
                <button
                    onClick={() => setIsRegister(!isRegister)}
                    className="w-full mt-4 text-sm text-zinc-500 hover:text-white"
                >
                    {isRegister ? 'Bereits ein Konto? Login' : 'Neu hier? Jetzt Registrieren'}
                </button>
            </div>
        </div>
    );
}
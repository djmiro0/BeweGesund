export default function HeroSection({ openAuth }: any) {
    return (
        <section className="h-screen flex items-center justify-center text-center px-6">
            <div className="max-w-4xl">
                <h1 className="text-6xl md:text-8xl font-black italic mb-6">EROBERE DEINEN KÖRPER</h1>
                <button onClick={openAuth} className="bg-orange-600 px-10 py-4 font-black uppercase skew-x-[-12deg]">
                    <span className="inline-block skew-x-[12deg]">Jetzt Starten</span>
                </button>
            </div>
        </section>
    );
}
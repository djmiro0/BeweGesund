"use client";

import { LockKeyhole, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface MemberAccessCalloutProps {
  onSignIn: () => void;
}

export default function MemberAccessCallout({
  onSignIn,
}: MemberAccessCalloutProps) {
  const t = useTranslations("memberAccess");

  return (
    <section className="rounded-[2rem] border border-orange-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_35%),linear-gradient(160deg,_rgba(24,24,27,0.98),_rgba(9,9,11,0.98))] p-8 md:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-200">
        <LockKeyhole size={14} />
        {t("badge")}
      </div>
      <div className="grid gap-6 md:grid-cols-[1.5fr_0.9fr] md:items-end">
        <div>
          <h3 className="max-w-2xl text-3xl font-black uppercase italic text-white md:text-4xl">
            {t("title")}
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
            {t("description")}
          </p>
        </div>
        <div className="md:justify-self-end">
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:bg-orange-500 hover:text-white"
          >
            <Sparkles size={16} />
            {t("cta")}
          </button>
        </div>
      </div>
    </section>
  );
}

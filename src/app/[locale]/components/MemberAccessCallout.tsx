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
    <section className="rounded-[2rem] border border-[rgba(47,38,24,0.1)] bg-[radial-gradient(circle_at_top_left,_rgba(226,61,79,0.12),_transparent_32%),radial-gradient(circle_at_80%_18%,_rgba(136,153,45,0.14),_transparent_18%),linear-gradient(160deg,_rgba(255,250,240,0.96),_rgba(247,241,230,0.94))] p-8 text-[rgb(47,38,24)] shadow-[0_28px_74px_rgba(83,57,20,0.12)] md:p-10">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(226,61,79,0.18)] bg-[rgba(226,61,79,0.08)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[rgb(226,61,79)]">
        <LockKeyhole size={14} />
        {t("badge")}
      </div>
      <div className="grid gap-6 md:grid-cols-[1.5fr_0.9fr] md:items-end">
        <div>
          <h3 className="max-w-2xl text-3xl font-black uppercase italic text-[rgb(47,38,24)] md:text-4xl">
            {t("title")}
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[rgba(47,38,24,0.72)] md:text-lg">
            {t("description")}
          </p>
        </div>
        <div className="md:justify-self-end">
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-3 rounded-full bg-[rgb(47,38,24)] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[rgb(247,241,230)] transition hover:bg-[rgb(226,61,79)]"
          >
            <Sparkles size={16} />
            {t("cta")}
          </button>
        </div>
      </div>
    </section>
  );
}

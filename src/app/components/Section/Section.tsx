"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface SectionProps {
  id: string;
  reverse?: boolean;
}

const Section: React.FC<SectionProps> = ({ id, reverse }) => {
  const t = useTranslations("sections");
  const router = useRouter();

  const handleJoinClick = () => {
    // navigate to calendar page, optionally with query param for course id
    router.push(`/calendar?course=${id}`);
  };

  return (
    <section id={id} className={`section ${reverse ? "reverse" : ""}`}>
      <div className="section-inner">
        <div className="section-image" />
        <div className="section-text">
          <h2>{t(`${id}.title`)}</h2>
          <p>{t(`${id}.text`)}</p>
          <button className="join-btn" onClick={handleJoinClick}>
            {t("join")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Section;

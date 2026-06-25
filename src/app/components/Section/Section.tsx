"use client";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import style from "./Section.module.css";

interface SectionProps {
  id: string;
  reverse?: boolean;
}

const Section: React.FC<SectionProps> = ({ id, reverse }) => {
  const t = useTranslations("sections");
  const locale = useLocale();

  // Map section id to image file
  const imageMap: Record<string, string> = {
    kurse: "/training.jpg",
    community: "/weights.jpg",
    ernaehrung: "/food.jpg",
  };

  const imageSrc = imageMap[id] || "/training.jpg"; // fallback

  return (
    <section id={id} className={reverse ? style.sectionReverse : style.section}>
      <div className={style.sectionInner}>
        <div className={style.sectionImage}>
          <Image
            src={imageSrc}
            alt={t(`${id}.title`)}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={style.image}
          />
        </div>
        <div className={style.sectionText}>
          <h2>{t(`${id}.title`)}</h2>
          <p>{t(`${id}.text`)}</p>
          <Link className={style.joinBtn} href={`/${locale}/calendar?course=${id}`}>
            {t("join")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Section;

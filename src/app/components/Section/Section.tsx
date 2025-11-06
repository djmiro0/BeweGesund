"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import style from "./Section.module.css";

interface SectionProps {
  id: string;
  reverse?: boolean;
}

const Section: React.FC<SectionProps> = ({ id, reverse }) => {
  const t = useTranslations("sections");
  const router = useRouter();

  const handleJoinClick = () => {
    router.push(`[locale]/calendar?course=${id}`);
  };

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
          <button className={style.joinBtn} onClick={handleJoinClick}>
            {t("join")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Section;

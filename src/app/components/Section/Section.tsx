"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import style from "./Section.module.css"

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
    <section id={id} className={(reverse ? style.sectionReverse : style.section)}>
      <div className={style.sectionInner}>
        <div className={style.sectionImage} />
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

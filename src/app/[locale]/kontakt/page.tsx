"use client";

import { useTranslations } from "next-intl";
import InfoPage from "@/app/components/InfoPage/InfoPage";

export default function KontaktPage() {
  const t = useTranslations("contactPage");
  const sections = t.raw("cards") as Array<{ title: string; body: string }>;

  return (
    <InfoPage
      title={t("title")}
      intro={t("intro")}
      sections={sections}
      note={t("note")}
      ctaLabel={t("cta")}
      ctaHref="/consultation"
    />
  );
}

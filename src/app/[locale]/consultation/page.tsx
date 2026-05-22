"use client";

import { useTranslations } from "next-intl";
import InfoPage from "@/app/components/InfoPage/InfoPage";

export default function ConsultationPage() {
  const t = useTranslations("consultationPage");
  const sections = t.raw("sections") as Array<{ title: string; body: string }>;

  return (
    <InfoPage
      title={t("title")}
      intro={t("intro")}
      sections={sections}
      note={t("note")}
    />
  );
}

"use client";

import { useTranslations } from "next-intl";
import InfoPage from "@/app/components/InfoPage/InfoPage";

export default function KontaktPage() {
  const contactT = useTranslations("contactPage");
  const consultationT = useTranslations("consultationPage");
  const sections = [
    ...(contactT.raw("cards") as Array<{ title: string; body: string }>),
    ...(consultationT.raw("sections") as Array<{ title: string; body: string }>),
  ];

  return (
    <InfoPage
      title={contactT("title")}
      intro={contactT("intro")}
      sections={sections}
      note={contactT("note")}
    />
  );
}

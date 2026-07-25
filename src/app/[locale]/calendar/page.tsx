import { getCalendarDays } from "@/lib/contentful";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const days = await getCalendarDays(locale);
  const protectedDays = days.map((day) => ({
    ...day,
    entries: day.entries.map((entry) => ({
      ...entry,
      liveTrainingLink: entry.liveTrainingLink ? "protected" : null,
    })),
  }));

  return <CalendarClient days={protectedDays} />;
}

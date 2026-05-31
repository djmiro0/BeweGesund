import { getCalendarDays } from "@/lib/contentful";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const days = await getCalendarDays(locale);

  return <CalendarClient days={days} />;
}

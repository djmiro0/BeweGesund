import { getCourses } from "@/lib/contentful";
import CoursesClient from "./CoursesClient";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const courses = await getCourses(locale);

  return <CoursesClient courses={courses} />;
}

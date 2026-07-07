import AdminQuizBuilder from "./AdminQuizBuilder";

export default async function AdminQuizzesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <AdminQuizBuilder locale={locale} />;
}

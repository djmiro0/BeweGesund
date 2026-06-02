import { getBlogPosts } from "@/lib/contentful";
import BlogIndex from "./BlogIndex";

export default async function BlogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = await getBlogPosts(locale);

  return <BlogIndex locale={locale} posts={posts} />;
}

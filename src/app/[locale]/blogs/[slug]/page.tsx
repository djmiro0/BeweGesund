import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ImageIcon } from "lucide-react";
import { getBlogPost } from "@/lib/contentful";
import ArticleBody from "./ArticleBody";
import styles from "../Blogs.module.css";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getBlogPost(locale, slug);

  if (!post) notFound();

  const labels = locale === "de"
    ? { back: "Zurück zu Blogs", read: "Min. Lesezeit" }
    : { back: "Back to blogs", read: "min read" };
  return (
    <article className={styles.articlePage}>
      <Link href={`/${locale}/blogs`} className={styles.backLink}>
        <ArrowLeft size={17} />
        {labels.back}
      </Link>

      <header className={styles.articleHeader}>
        <h1 className={styles.articleTitle}>{post.title}</h1>
        <p className={styles.articleExcerpt}>{post.excerpt}</p>
        <div className={styles.postMeta}>
          <span>{post.author}</span>
          <span>
            <Clock size={14} />
            {post.readTimeMinutes} {labels.read}
          </span>
          <time dateTime={post.publishedAt}>
            {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(post.publishedAt))}
          </time>
        </div>
      </header>

      <div className={styles.articleImageWrap}>
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 1120px, 100vw"
            className={styles.articleImage}
            priority
          />
        ) : (
          <span className={styles.imageFallback} aria-hidden="true">
            <ImageIcon size={38} />
          </span>
        )}
      </div>

      <ArticleBody body={post.body} />
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, ImageIcon } from "lucide-react";
import { getBlogPost, getBlogPosts, type BlogPost } from "@/lib/contentful";
import BackButton from "../../components/BackButton";
import ArticleBody from "./ArticleBody";
import BlogSelfCheck from "./BlogSelfCheck";
import styles from "../Blogs.module.css";

function getRecommendedPost(currentPost: BlogPost, posts: BlogPost[]) {
  const candidates = posts.filter((post) => post.slug !== currentPost.slug);

  return candidates
    .map((post, index) => ({
      post,
      index,
      sharedTags: post.tags.filter((tag) => currentPost.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.sharedTags - a.sharedTags || a.index - b.index)[0]?.post ?? null;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [post, posts] = await Promise.all([
    getBlogPost(locale, slug),
    getBlogPosts(locale),
  ]);

  if (!post) notFound();

  const labels = locale === "de"
    ? {
        back: "Zurück zu Blogs",
        read: "Min. Lesezeit",
        recommendedEyebrow: "Empfohlener nächster Artikel",
        recommendedTitle: "Passend dazu weiterlesen",
        recommendedRead: "Artikel öffnen",
      }
    : {
        back: "Back to blogs",
        read: "min read",
        recommendedEyebrow: "Recommended next article",
        recommendedTitle: "Keep reading on this topic",
        recommendedRead: "Open article",
      };
  const recommendedPost = getRecommendedPost(post, posts);

  return (
    <article className={styles.articlePage}>
      <BackButton href={`/${locale}/blogs`} className={styles.backLink}>
        <ArrowLeft size={17} />
        {labels.back}
      </BackButton>

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

      {post.tags.includes("selfcheck") ? <BlogSelfCheck locale={locale} /> : null}

      {recommendedPost ? (
        <aside className={styles.recommendedPost} aria-labelledby="recommended-blog-title">
          <div className={styles.recommendedPostCopy}>
            <p className={styles.recommendedEyebrow}>{labels.recommendedEyebrow}</p>
            <h2 id="recommended-blog-title" className={styles.recommendedTitle}>
              {labels.recommendedTitle}
            </h2>
            <h3 className={styles.recommendedPostTitle}>
              <Link href={`/${locale}/blogs/${recommendedPost.slug}`}>{recommendedPost.title}</Link>
            </h3>
            <p className={styles.recommendedExcerpt}>{recommendedPost.excerpt}</p>
            <div className={styles.postMeta}>
              <span>{recommendedPost.author}</span>
              <span>
                <Clock size={14} />
                {recommendedPost.readTimeMinutes} {labels.read}
              </span>
            </div>
            <Link href={`/${locale}/blogs/${recommendedPost.slug}`} className={styles.readLink}>
              {labels.recommendedRead}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <Link href={`/${locale}/blogs/${recommendedPost.slug}`} className={styles.recommendedImageLink}>
            {recommendedPost.featuredImage ? (
              <Image
                src={recommendedPost.featuredImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 320px, 100vw"
                className={styles.postImage}
              />
            ) : (
              <span className={styles.imageFallback} aria-hidden="true">
                <ImageIcon size={28} />
              </span>
            )}
          </Link>
        </aside>
      ) : null}
    </article>
  );
}

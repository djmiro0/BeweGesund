"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight, BookOpen, Clock, Search } from "lucide-react";
import type { BlogPost, BlogTag } from "@/lib/contentful";
import styles from "./Blogs.module.css";

const tagOptions: Array<{ id: "all" | BlogTag; label: string }> = [
  { id: "all", label: "All" },
  { id: "nutrition", label: "Nutrition" },
  { id: "health", label: "Health" },
  { id: "training", label: "Sport / Training" },
];

interface BlogIndexProps {
  locale: string;
  posts: BlogPost[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

export default function BlogIndex({ locale, posts }: BlogIndexProps) {
  const t = useTranslations("blogs");
  const [activeTag, setActiveTag] = useState<"all" | BlogTag>("all");
  const filteredPosts = useMemo(
    () => posts.filter((post) => activeTag === "all" || post.tags.includes(activeTag)),
    [activeTag, posts],
  );

  const featuredPost = filteredPosts[0];
  const restPosts = filteredPosts.slice(1);

  return (
    <section className={styles.blogsPage}>
      <motion.header
        className={styles.hero}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.intro}>
            {t("intro")}
          </p>
        </div>
        <div className={styles.heroMeta} aria-label="Blog overview">
          <span>
            <BookOpen size={16} />
            {t("articleCount", { count: posts.length })}
          </span>
          <span>
            <Search size={16} />
            {t("filterHint")}
          </span>
        </div>
      </motion.header>

      <div className={styles.filterRail} aria-label="Blog tags">
        {tagOptions.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`${styles.filterButton} ${activeTag === tag.id ? styles.filterButtonActive : ""}`}
            onClick={() => setActiveTag(tag.id)}
            aria-pressed={activeTag === tag.id}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {featuredPost ? (
        <motion.div
          key={activeTag}
          className={styles.postLayout}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.07,
              },
            },
          }}
        >
          <motion.article className={styles.featuredPost} variants={fadeUp}>
            <Link href={`/${locale}/blogs/${featuredPost.slug}`} className={styles.featuredImageLink}>
              <Image
                src={featuredPost.featuredImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={styles.featuredImage}
              />
            </Link>
            <div className={styles.featuredCopy}>
              <div className={styles.tagRow}>
                {featuredPost.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
              <h2 className={styles.featuredTitle}>
                <Link href={`/${locale}/blogs/${featuredPost.slug}`}>{featuredPost.title}</Link>
              </h2>
              <p className={styles.excerpt}>{featuredPost.excerpt}</p>
              <div className={styles.postMeta}>
                <span>{featuredPost.author}</span>
                <span>
                  <Clock size={14} />
                  {featuredPost.readTimeMinutes} min
                </span>
              </div>
              <Link href={`/${locale}/blogs/${featuredPost.slug}`} className={styles.readLink}>
                {t("readArticle")}
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </motion.article>

          <div className={styles.postList}>
            {restPosts.map((post) => (
              <motion.article key={post.id} className={styles.postItem} variants={fadeUp}>
                <Link href={`/${locale}/blogs/${post.slug}`} className={styles.postImageLink}>
                  <Image
                    src={post.featuredImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 220px, 36vw"
                    className={styles.postImage}
                  />
                </Link>
                <div className={styles.postCopy}>
                  <div className={styles.tagRow}>
                    {post.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <h2 className={styles.postTitle}>
                    <Link href={`/${locale}/blogs/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                  <div className={styles.postMeta}>
                    <span>{post.author}</span>
                    <span>
                      <Clock size={14} />
                      {post.readTimeMinutes} min
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className={styles.emptyState}>
          <p>{t("empty")}</p>
        </div>
      )}
    </section>
  );
}

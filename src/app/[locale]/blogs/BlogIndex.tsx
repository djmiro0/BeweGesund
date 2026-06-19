"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight, BookOpen, Clock, ImageIcon, Search, X } from "lucide-react";
import type { BlogPost, BlogTag } from "@/lib/contentful";
import { blogTagOptions, getBlogTagLabel } from "./blogTags";
import styles from "./Blogs.module.css";

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
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const updateSearchQuery = (value: string) => {
    setSearchQuery(value);
  };
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesTag = activeTag === "all" || post.tags.includes(activeTag);
      const matchesSearch = !normalizedSearchQuery
        || [
          post.title,
          post.excerpt,
          post.author,
          ...post.tags.map((tag) => getBlogTagLabel(tag, t)),
        ].some((value) => value.toLowerCase().includes(normalizedSearchQuery));

      return matchesTag && matchesSearch;
    });
  }, [activeTag, normalizedSearchQuery, posts, t]);

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

      <div className={styles.filterPanel}>
        <label className={styles.searchField}>
          <Search size={18} aria-hidden="true" />
          <span className={styles.visuallyHidden}>{t("searchLabel")}</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => updateSearchQuery(event.target.value)}
            onInput={(event) => updateSearchQuery(event.currentTarget.value)}
            placeholder={t("searchPlaceholder")}
          />
          {searchQuery ? (
            <button
              type="button"
              className={styles.clearSearchButton}
              aria-label={t("clearSearch")}
              onClick={() => updateSearchQuery("")}
            >
              <X size={16} />
            </button>
          ) : null}
        </label>

        <div className={styles.filterRail} aria-label={t("filterAria")}>
          {blogTagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`${styles.filterButton} ${activeTag === tag ? styles.filterButtonActive : ""}`}
              onClick={() => setActiveTag(tag)}
              aria-pressed={activeTag === tag}
            >
              {getBlogTagLabel(tag, t)}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length ? (
        <motion.div
          key={`${activeTag}-${normalizedSearchQuery}`}
          className={styles.postGrid}
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
          {filteredPosts.map((post) => (
            <motion.article key={post.id} className={styles.postCard} variants={fadeUp}>
              {post.featuredImage ? (
                <Link href={`/${locale}/blogs/${post.slug}`} className={styles.postImageLink}>
                  <Image
                    src={post.featuredImage}
                    alt=""
                    fill
                    sizes="(min-width: 1120px) 508px, (min-width: 981px) calc((100vw - 4.2rem) / 2), calc(100vw - 3.7rem)"
                    className={styles.postImage}
                  />
                </Link>
              ) : (
                <Link href={`/${locale}/blogs/${post.slug}`} className={styles.postImageLink}>
                  <span className={styles.imageFallback} aria-hidden="true">
                    <ImageIcon size={24} />
                  </span>
                </Link>
              )}
              <div className={styles.postCopy}>
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
                <Link href={`/${locale}/blogs/${post.slug}`} className={styles.readLink}>
                  {t("readArticle")}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      ) : (
        <div className={styles.emptyState}>
          <p>{t("empty")}</p>
        </div>
      )}
    </section>
  );
}

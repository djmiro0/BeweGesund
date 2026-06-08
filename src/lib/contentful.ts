import { memberCourses, mockVideos, type MemberCourseDefinition, type MemberPackage } from "@/data";

export type ContentfulCalendarFormat = "training" | "seminar";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  liveTrainingLink: string | null;
  slug: string;
  startsAt: string;
  durationMinutes: number;
  formatKey: ContentfulCalendarFormat;
  coach: string;
  packageRequired: MemberPackage;
  muxPlaybackId: string | null;
  isLive: boolean;
}

export interface CalendarDay {
  id: string;
  date: string;
  entries: CalendarEvent[];
}

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  slug: string;
  duration: string;
  level: string;
  image: string;
  muxPlaybackId: string | null;
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  exerciseInstructions: string;
  duration: string;
  level: string;
  coach: string;
  packageRequired: MemberPackage;
  muxPlaybackId: string | null;
  posterImage: string | null;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryKey: unknown;
  categoryTitle: string;
  categoryDescription: string;
  durationMinutes: number | null;
  unlocksPerWeek: number | null;
  note: string;
  coach: string;
  packageRequired: MemberPackage;
  subcategoryKey: string;
  posterImage: string | null;
  order: number;
  publishedAt: string;
  hasVideo: boolean;
  isLive: boolean;
  liveTrainingLink: string | null;
}

export type BlogTag = "nutrition" | "health" | "training";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  body: string;
  tags: BlogTag[];
  author: string;
  readTimeMinutes: number;
  publishedAt: string;
  featuredImage: string | null;
}

interface ContentfulEntry<TFields> {
  sys: {
    id: string;
  };
  fields: TFields;
}

interface ContentfulCollection<TFields> {
  items: Array<ContentfulEntry<TFields>>;
  includes?: {
    Asset?: Array<ContentfulEntry<{ file?: { url?: string } }>>;
  };
}

type CalendarEventFields = Partial<{
  title: string;
  description: string;
  liveTrainingLink: string;
  slug: string;
  startsAt: string;
  dateTime: string;
  durationMinutes: number;
  format: ContentfulCalendarFormat;
  coach: string;
  packageRequired: MemberPackage;
  muxPlaybackId: string;
  live: boolean;
  isLive: boolean;
}>;

type TrainingVideoFields = Partial<{
  title: string;
  description: string;
  slug: string;
  duration: string;
  level: string;
  image: { sys?: { id?: string }; fields?: { file?: { url?: string } } } | string;
  featuredImage: { sys?: { id?: string }; fields?: { file?: { url?: string } } } | string;
  muxPlaybackId: string;
}>;

type ContentfulAssetField = { sys?: { id?: string }; fields?: { file?: { url?: string } } } | string;

type BlogPostFields = Partial<{
  title: string;
  excerpt: string;
  slug: string;
  body: string;
  tags: string[];
  author: string;
  readTimeMinutes: number;
  publishedAt: string;
  featuredImage: ContentfulAssetField;
  image: ContentfulAssetField;
}>;

type CourseFields = Partial<{
  title: string;
  slug: string;
  description: string;
  exerciseInstructions: string;
  categoryKey: string | string[];
  categoryTitle: string;
  categoryDescription: string;
  durationMinutes: number;
  unlocksPerWeek: number;
  note: string;
  duration: string | number;
  level: string;
  subcategoryKey: string | string[];
  tags: string | string[];
  coach: string;
  packageRequired: MemberPackage;
  muxPlaybackId: string;
  posterImage: ContentfulAssetField;
  image: ContentfulAssetField;
  featuredImage: ContentfulAssetField;
  order: number;
  publishedAt: string;
  live: boolean;
  isLive: boolean;
  liveTrainingLink: string;
}>;

const defaultCalendarContentType = "calendarEvent";
const defaultVideoContentType = "trainingVideo";
const defaultBlogContentType = "blogPost";
const defaultCourseContentType = "course";

function hasContentfulConfig() {
  return Boolean(process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_DELIVERY_TOKEN);
}

function warnMissingContentfulConfig(contentType: string) {
  console.warn(
    `Contentful config missing for ${contentType}. Set CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN in .env.local or deployment env vars.`,
  );
}

function getContentfulLocale(locale: string) {
  if (locale === "de") return process.env.CONTENTFUL_LOCALE_DE ?? "de";
  if (locale === "en") return process.env.CONTENTFUL_LOCALE_EN ?? "en-US";
  return locale;
}

async function fetchEntries<TFields>(
  contentType: string,
  locale: string,
  searchParams: Record<string, string> = {},
) {
  if (!hasContentfulConfig()) {
    warnMissingContentfulConfig(contentType);
    return null;
  }

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const environment = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
  const accessToken = process.env.CONTENTFUL_DELIVERY_TOKEN;
  const url = new URL(
    `https://cdn.contentful.com/spaces/${spaceId}/environments/${environment}/entries`,
  );

  url.searchParams.set("access_token", accessToken ?? "");
  url.searchParams.set("content_type", contentType);
  url.searchParams.set("locale", getContentfulLocale(locale));
  url.searchParams.set("include", "2");

  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    console.warn(`Contentful request failed for ${contentType}: ${response.status}`);
    return null;
  }

  return (await response.json()) as ContentfulCollection<TFields>;
}

function normalizePackage(value: string | undefined): MemberPackage {
  if (value === "starter" || value === "rehab-plus" || value === "all-access") {
    return value;
  }

  return "starter";
}

function normalizeFormat(value: string | undefined): ContentfulCalendarFormat {
  return value === "seminar" ? "seminar" : "training";
}

function normalizeStringList(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeKey(value: unknown) {
  const text = Array.isArray(value) ? value[0] : value;

  if (typeof text !== "string") return undefined;

  return text
    ?.replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "ae")
    .replace(/Ö/g, "oe")
    .replace(/Ü/g, "ue")
    .replace(/ß/g, "ss")
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromKey(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export async function getCalendarDays(locale: string): Promise<CalendarDay[]> {
  const [collection, courses] = await Promise.all([
    fetchEntries<CalendarEventFields>(
      process.env.CONTENTFUL_CALENDAR_CONTENT_TYPE ?? defaultCalendarContentType,
      locale,
      {
        order: "fields.startsAt",
      },
    ),
    getCourses(locale),
  ]);

  const calendarEvents = (collection?.items ?? [])
    .map((item) => {
      const startsAt = item.fields.startsAt ?? item.fields.dateTime;
      if (!startsAt || !item.fields.title) return null;

      return {
        id: item.sys.id,
        title: item.fields.title,
        description: item.fields.description ?? "",
        liveTrainingLink: item.fields.liveTrainingLink ?? null,
        slug: item.fields.slug ?? item.sys.id,
        startsAt,
        durationMinutes: Number(item.fields.durationMinutes ?? 30),
        formatKey: normalizeFormat(item.fields.format),
        coach: item.fields.coach ?? "Sandra",
        packageRequired: normalizePackage(item.fields.packageRequired),
        muxPlaybackId: item.fields.muxPlaybackId ?? null,
        isLive: item.fields.live ?? item.fields.isLive ?? Boolean(item.fields.liveTrainingLink),
      } satisfies CalendarEvent;
    })
    .filter((event): event is CalendarEvent => Boolean(event));

  const courseReleases = courses
    .filter((course) => course.hasVideo && Boolean(course.publishedAt))
    .map((course) => ({
      id: `course-${course.id}`,
      title: course.title,
      description: course.description,
      liveTrainingLink: `/${locale}/courses/${course.slug}`,
      slug: course.slug,
      startsAt: course.publishedAt,
      durationMinutes: course.durationMinutes ?? 30,
      formatKey: "training" as const,
      coach: course.coach || "Sandra",
      packageRequired: course.packageRequired,
      muxPlaybackId: null,
      isLive: course.isLive,
    } satisfies CalendarEvent));

  const events = [...calendarEvents, ...courseReleases]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const days = new Map<string, CalendarDay>();

  events.forEach((event) => {
    const date = event.startsAt.slice(0, 10);
    const day = days.get(date) ?? { id: date, date, entries: [] };
    day.entries.push(event);
    days.set(date, day);
  });

  return Array.from(days.values());
}

function normalizeImage(image: ContentfulAssetField | undefined, assetUrls: Map<string, string>) {
  if (!image) return "";
  if (typeof image === "string") return image;

  const linkedAssetId = image.sys?.id;
  const url = image.fields?.file?.url ?? (linkedAssetId ? assetUrls.get(linkedAssetId) : undefined);
  if (!url) return "";

  return url.startsWith("//") ? `https:${url}` : url;
}

function buildAssetUrlMap<TFields>(collection: ContentfulCollection<TFields> | null) {
  return new Map<string, string>(
    collection?.includes?.Asset?.flatMap((asset) =>
      asset.fields.file?.url ? [[asset.sys.id, asset.fields.file.url]] : [],
    ) ?? [],
  );
}

function mergeAssetUrlMaps(primary: Map<string, string>, fallback: Map<string, string>) {
  return new Map([...fallback, ...primary]);
}

export async function getTrainingVideos(locale: string): Promise<TrainingVideo[]> {
  const collection = await fetchEntries<TrainingVideoFields>(
    process.env.CONTENTFUL_VIDEO_CONTENT_TYPE ?? defaultVideoContentType,
    locale,
    {
      order: "-sys.updatedAt",
    },
  );

  if (!collection?.items.length) {
    return mockVideos.map((video) => ({
      id: String(video.id),
      title: video.title,
      description: "",
      slug: String(video.id),
      duration: video.duration,
      level: video.level,
      image: video.image,
      muxPlaybackId: null,
    }));
  }

  const assetUrls = buildAssetUrlMap(collection);

  return collection.items
    .map((item) => ({
      id: item.sys.id,
      title: item.fields.title ?? "Training",
      description: item.fields.description ?? "",
      slug: item.fields.slug ?? item.sys.id,
      duration: item.fields.duration ?? "",
      level: item.fields.level ?? "",
      image: normalizeImage(item.fields.image ?? item.fields.featuredImage, assetUrls),
      muxPlaybackId: item.fields.muxPlaybackId ?? null,
    }))
    .filter((video) => video.image || video.muxPlaybackId);
}

function mapCourseDetail(
  item: ContentfulEntry<CourseFields>,
  assetUrls: Map<string, string>,
): CourseDetail | null {
  if (!item.fields.title) return null;

  return {
    id: item.sys.id,
    title: item.fields.title,
    slug: item.fields.slug ?? item.sys.id,
    description: item.fields.description ?? "",
    exerciseInstructions: item.fields.exerciseInstructions ?? "",
    duration: item.fields.duration ? String(item.fields.duration) : "",
    level: item.fields.level ?? "",
    coach: item.fields.coach ?? "",
    packageRequired: normalizePackage(item.fields.packageRequired),
    muxPlaybackId: item.fields.muxPlaybackId ?? null,
    posterImage: normalizeImage(
      item.fields.posterImage ?? item.fields.featuredImage ?? item.fields.image,
      assetUrls,
    ) || null,
  };
}

function mapCourseSummary(
  item: ContentfulEntry<CourseFields>,
  assetUrls: Map<string, string>,
): CourseSummary | null {
  if (!item.fields.title) return null;

  const slug = item.fields.slug ?? item.sys.id;
  const tags = normalizeStringList(item.fields.tags);
  const categoryKey = normalizeKey(item.fields.categoryKey ?? tags[0]) ?? "courses";
  const durationMinutes =
    item.fields.durationMinutes ??
    (typeof item.fields.duration === "number" ? item.fields.duration : undefined);

  return {
    id: item.sys.id,
    title: item.fields.title,
    slug,
    description: item.fields.description ?? "",
    categoryKey,
    categoryTitle: item.fields.categoryTitle ?? titleFromKey(tags[0] ?? categoryKey),
    categoryDescription: item.fields.categoryDescription ?? "",
    durationMinutes: durationMinutes ? Number(durationMinutes) : null,
    unlocksPerWeek: item.fields.unlocksPerWeek ? Number(item.fields.unlocksPerWeek) : null,
    note: item.fields.note ?? "",
    coach: item.fields.coach ?? "",
    packageRequired: normalizePackage(item.fields.packageRequired),
    subcategoryKey: normalizeKey(item.fields.subcategoryKey) ?? "",
    posterImage: normalizeImage(
      item.fields.posterImage ?? item.fields.featuredImage ?? item.fields.image,
      assetUrls,
    ) || null,
    order: Number(item.fields.order ?? 0),
    publishedAt: item.fields.publishedAt ?? "",
    hasVideo: Boolean(item.fields.muxPlaybackId),
    isLive: item.fields.live ?? item.fields.isLive ?? Boolean(item.fields.liveTrainingLink),
    liveTrainingLink: item.fields.liveTrainingLink ?? null,
  };
}

function mapMemberCourseSummary(course: MemberCourseDefinition, order: number): CourseSummary {
  return {
    id: course.id,
    title: course.id,
    slug: course.id,
    description: "",
    categoryKey: course.categoryKey,
    categoryTitle: titleFromKey(course.categoryKey),
    categoryDescription: "",
    durationMinutes: course.durationMinutes ?? null,
    unlocksPerWeek: course.unlocksPerWeek ?? null,
    note: course.noteKey ?? "",
    coach: course.coach ?? "",
    packageRequired: course.packageRequired,
    subcategoryKey: course.id,
    posterImage: null,
    order,
    publishedAt: "",
    hasVideo: false,
    isLive: false,
    liveTrainingLink: null,
  };
}

function mergeCourseSummaries(contentfulCourses: CourseSummary[]) {
  const merged = new Map<string, CourseSummary>();

  memberCourses.forEach((course, index) => {
    merged.set(course.id, mapMemberCourseSummary(course, index));
  });

  contentfulCourses.forEach((course) => {
    const plannedCourse = merged.get(course.slug) ?? merged.get(course.id);

    if (!plannedCourse) {
      merged.set(course.slug, course);
      return;
    }

    merged.set(plannedCourse.id, {
      ...plannedCourse,
      ...course,
      id: plannedCourse.id,
      slug: course.slug || plannedCourse.slug,
      categoryKey: plannedCourse.categoryKey,
      durationMinutes: course.durationMinutes ?? plannedCourse.durationMinutes,
      unlocksPerWeek: course.unlocksPerWeek ?? plannedCourse.unlocksPerWeek,
      note: course.note || plannedCourse.note,
      coach: course.coach || plannedCourse.coach,
      packageRequired: course.packageRequired || plannedCourse.packageRequired,
      subcategoryKey: course.subcategoryKey || plannedCourse.subcategoryKey,
      posterImage: course.posterImage || plannedCourse.posterImage,
      order: plannedCourse.order,
      hasVideo: course.hasVideo,
      isLive: course.isLive,
      liveTrainingLink: course.liveTrainingLink,
    });
  });

  return Array.from(merged.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate || a.title.localeCompare(b.title);
  });
}

export async function getCourses(locale: string): Promise<CourseSummary[]> {
  const collection = await fetchEntries<CourseFields>(
    process.env.CONTENTFUL_COURSE_CONTENT_TYPE ?? defaultCourseContentType,
    locale,
  );

  if (!collection?.items.length) return mergeCourseSummaries([]);

  const assetUrls = buildAssetUrlMap(collection);
  const contentfulCourses = collection.items
    .map((item) => mapCourseSummary(item, assetUrls))
    .filter((course): course is CourseSummary => Boolean(course));

  return mergeCourseSummaries(contentfulCourses);
}

export async function getCourseDetail(locale: string, slug: string): Promise<CourseDetail | null> {
  const collection = await fetchEntries<CourseFields>(
    process.env.CONTENTFUL_COURSE_CONTENT_TYPE ?? defaultCourseContentType,
    locale,
    {
      "fields.slug": slug,
      limit: "1",
    },
  );

  if (!collection?.items.length) {
    return null;
  }

  const fallbackCollection = locale === "en"
    ? null
    : await fetchEntries<CourseFields>(
        process.env.CONTENTFUL_COURSE_CONTENT_TYPE ?? defaultCourseContentType,
        "en",
        {
          "sys.id": collection.items[0].sys.id,
          limit: "1",
        },
      );
  const assetUrls = mergeAssetUrlMaps(buildAssetUrlMap(collection), buildAssetUrlMap(fallbackCollection));

  return mapCourseDetail(collection.items[0], assetUrls);
}

function normalizeBlogTags(tags: string[] | undefined): BlogTag[] {
  const validTags: BlogTag[] = ["nutrition", "health", "training"];

  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.toLowerCase().trim())
        .filter((tag): tag is BlogTag => validTags.includes(tag as BlogTag)),
    ),
  );
}

function mapBlogPost(
  item: ContentfulEntry<BlogPostFields>,
  assetUrls: Map<string, string>,
): BlogPost | null {
  if (!item.fields.title) return null;

  return {
    id: item.sys.id,
    title: item.fields.title,
    excerpt: item.fields.excerpt ?? "",
    slug: item.fields.slug ?? item.sys.id,
    body: item.fields.body ?? "",
    tags: normalizeBlogTags(item.fields.tags),
    author: item.fields.author ?? "Bewegesund",
    readTimeMinutes: Number(item.fields.readTimeMinutes ?? 4),
    publishedAt: item.fields.publishedAt ?? new Date().toISOString(),
    featuredImage: normalizeImage(item.fields.featuredImage ?? item.fields.image, assetUrls) || null,
  };
}

export async function getBlogPosts(locale: string): Promise<BlogPost[]> {
  const collection = await fetchEntries<BlogPostFields>(
    process.env.CONTENTFUL_BLOG_CONTENT_TYPE ?? defaultBlogContentType,
    locale,
    {
      order: "-fields.publishedAt",
    },
  );

  if (!collection?.items.length) return [];

  const fallbackCollection = locale === "en"
    ? null
    : await fetchEntries<BlogPostFields>(
        process.env.CONTENTFUL_BLOG_CONTENT_TYPE ?? defaultBlogContentType,
        "en",
        {
          order: "-fields.publishedAt",
        },
      );
  const assetUrls = mergeAssetUrlMaps(buildAssetUrlMap(collection), buildAssetUrlMap(fallbackCollection));

  return collection.items
    .map((item) => mapBlogPost(item, assetUrls))
    .filter((post): post is BlogPost => Boolean(post));
}

export async function getBlogPost(locale: string, slug: string): Promise<BlogPost | null> {
  const collection = await fetchEntries<BlogPostFields>(
    process.env.CONTENTFUL_BLOG_CONTENT_TYPE ?? defaultBlogContentType,
    locale,
    {
      "fields.slug": slug,
      limit: "1",
    },
  );

  if (!collection?.items.length) return null;

  const fallbackCollection = locale === "en"
    ? null
    : await fetchEntries<BlogPostFields>(
        process.env.CONTENTFUL_BLOG_CONTENT_TYPE ?? defaultBlogContentType,
        "en",
        {
          "sys.id": collection.items[0].sys.id,
          limit: "1",
        },
      );
  const assetUrls = mergeAssetUrlMaps(buildAssetUrlMap(collection), buildAssetUrlMap(fallbackCollection));

  return mapBlogPost(collection.items[0], assetUrls);
}

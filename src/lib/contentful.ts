import { activeScheduleDays, mockVideos, type MemberPackage } from "@/data";

export type ContentfulCalendarFormat = "training" | "seminar";

export interface CalendarEvent {
  id: string;
  title: string;
  titleKey?: string;
  description: string;
  liveTrainingLink: string | null;
  slug: string;
  startsAt: string;
  durationMinutes: number;
  formatKey: ContentfulCalendarFormat;
  coach: string;
  packageRequired: MemberPackage;
  muxPlaybackId: string | null;
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

const defaultCalendarContentType = "calendarEvent";
const defaultVideoContentType = "trainingVideo";

function hasContentfulConfig() {
  return Boolean(process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_DELIVERY_TOKEN);
}

function getContentfulLocale(locale: string) {
  if (locale === "de") return process.env.CONTENTFUL_LOCALE_DE ?? "de-DE";
  if (locale === "en") return process.env.CONTENTFUL_LOCALE_EN ?? "en-US";
  return locale;
}

async function fetchEntries<TFields>(
  contentType: string,
  locale: string,
  searchParams: Record<string, string> = {},
) {
  if (!hasContentfulConfig()) return null;

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

function fallbackCalendarDays(): CalendarDay[] {
  return activeScheduleDays.map((day) => ({
    ...day,
    entries: day.entries.map((entry) => ({
      id: entry.id,
      title: "",
      titleKey: entry.titleKey,
      description: "",
      liveTrainingLink: null,
      slug: entry.id,
      startsAt: entry.startsAt,
      durationMinutes: entry.durationMinutes,
      formatKey: entry.formatKey,
      coach: entry.coach,
      packageRequired: entry.packageRequired,
      muxPlaybackId: null,
    })),
  }));
}

export async function getCalendarDays(locale: string): Promise<CalendarDay[]> {
  const collection = await fetchEntries<CalendarEventFields>(
    process.env.CONTENTFUL_CALENDAR_CONTENT_TYPE ?? defaultCalendarContentType,
    locale,
    {
      order: "fields.startsAt",
    },
  );

  if (!collection?.items.length) return fallbackCalendarDays();

  const events = collection.items
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
      } satisfies CalendarEvent;
    })
    .filter((event): event is CalendarEvent => Boolean(event))
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

function normalizeImage(image: TrainingVideoFields["image"], assetUrls: Map<string, string>) {
  if (!image) return "";
  if (typeof image === "string") return image;

  const linkedAssetId = image.sys?.id;
  const url = image.fields?.file?.url ?? (linkedAssetId ? assetUrls.get(linkedAssetId) : undefined);
  if (!url) return "";

  return url.startsWith("//") ? `https:${url}` : url;
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

  const assetUrls = new Map<string, string>(
    collection.includes?.Asset?.flatMap((asset) =>
      asset.fields.file?.url ? [[asset.sys.id, asset.fields.file.url]] : [],
    ) ?? [],
  );

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

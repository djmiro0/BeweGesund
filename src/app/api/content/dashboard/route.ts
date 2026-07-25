import { NextResponse } from "next/server";
import {
  getBlogPosts,
  getCourses,
  getMeditationRelaxationItems,
} from "@/lib/contentful";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? "de";
  const [courses, posts, meditations] = await Promise.all([
    getCourses(locale),
    getBlogPosts(locale),
    getMeditationRelaxationItems(locale),
  ]);

  const liveCourseIds = Array.from(
    new Set(
      courses
        .filter((course) => course.isLive)
        .flatMap((course) => [course.id, course.slug, course.subcategoryKey])
        .filter(Boolean),
    ),
  );

  const workouts = courses
    .filter((course) => course.hasVideo)
    .toSorted((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    })
    .map(({ liveTrainingLink, ...course }) => {
      void liveTrainingLink;
      return course;
    });

  const recentPosts = posts.slice(0, 3).map(({ body, ...post }) => {
    void body;
    return post;
  });

  const meditationItems = meditations
    .filter((item) => item.muxPlaybackId)
    .map(({ instructions, ...item }) => {
      void instructions;
      return item;
    });

  const recentMeditations = meditationItems.slice(0, 3);

  return NextResponse.json({
    liveCourseIds,
    workouts,
    recentPosts,
    meditationItems,
    recentMeditations,
  });
}

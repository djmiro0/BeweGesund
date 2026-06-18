import type { UserProfileData } from "@/lib/userProfile";

export function getDashboardProgress(profile: UserProfileData | null) {
  if (!profile) {
    return {
      completedCourseCount: 0,
      upcomingCourseCount: 0,
      recommendedCourseIds: new Set<string>(),
    };
  }

  const completedIds = new Set(profile.completedCourseIds);
  const upcomingCourseIds = new Set(
    [...profile.startedCourseIds, ...profile.recommendedCourseIds]
      .filter((courseId) => !completedIds.has(courseId)),
  );

  return {
    completedCourseCount: completedIds.size,
    upcomingCourseCount: upcomingCourseIds.size,
    recommendedCourseIds: new Set(profile.recommendedCourseIds),
  };
}

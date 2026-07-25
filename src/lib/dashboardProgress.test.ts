import { describe, expect, it } from "vitest";
import { emptyUserProfile } from "./userProfile";
import { getDashboardProgress } from "./dashboardProgress";

describe("getDashboardProgress", () => {
  it("derives dashboard counts and recommendations from the user profile", () => {
    const progress = getDashboardProgress({
      ...emptyUserProfile,
      startedCourseIds: ["course-a", "course-b"],
      completedCourseIds: ["course-a", "course-c"],
      recommendedCourseIds: ["course-b", "course-c", "course-d"],
    });

    expect(progress.completedCourseCount).toBe(2);
    expect(progress.upcomingCourseCount).toBe(2);
    expect([...progress.recommendedCourseIds]).toEqual([
      "course-b",
      "course-c",
      "course-d",
    ]);
  });
});

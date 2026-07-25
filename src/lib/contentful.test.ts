import { BLOCKS } from "@contentful/rich-text-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getBlogPosts,
  getCourses,
  getMeditationRelaxationItems,
} from "./contentful";

function mockBlogResponse(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            sys: { id: "post-1" },
            fields: {
              title: "Test post",
              slug: "test-post",
              body,
            },
          },
        ],
      }),
    }),
  );
}

describe("Contentful blog body normalization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("converts legacy Long Text into Rich Text paragraphs", async () => {
    vi.stubEnv("CONTENTFUL_SPACE_ID", "space");
    vi.stubEnv("CONTENTFUL_DELIVERY_TOKEN", "token");
    mockBlogResponse("First paragraph.\n\nSecond paragraph.");

    const [post] = await getBlogPosts("en");

    expect(post.body.nodeType).toBe(BLOCKS.DOCUMENT);
    expect(post.body.content).toHaveLength(2);
  });

  it("uses an empty document for incomplete Rich Text payloads", async () => {
    vi.stubEnv("CONTENTFUL_SPACE_ID", "space");
    vi.stubEnv("CONTENTFUL_DELIVERY_TOKEN", "token");
    mockBlogResponse({ nodeType: BLOCKS.DOCUMENT });

    const [post] = await getBlogPosts("en");

    expect(post.body).toEqual({
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [],
    });
  });
});

describe("Contentful course normalization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps the package required by Contentful for recorded courses", async () => {
    vi.stubEnv("CONTENTFUL_SPACE_ID", "space");
    vi.stubEnv("CONTENTFUL_DELIVERY_TOKEN", "token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              sys: { id: "meditation-video-1" },
              fields: {
                title: "Guided meditation",
                slug: "guided-meditation",
                categoryKey: "meditation-relaxation",
                muxPlaybackId: "playback-1",
                packageRequired: "plus",
              },
            },
          ],
        }),
      }),
    );

    const courses = await getCourses("en");
    const course = courses.find((item) => item.slug === "guided-meditation");

    expect(course?.packageRequired).toBe("plus");
  });
});

describe("Contentful meditation and relaxation normalization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("maps the dedicated meditation and relaxation content type", async () => {
    vi.stubEnv("CONTENTFUL_SPACE_ID", "space");
    vi.stubEnv("CONTENTFUL_DELIVERY_TOKEN", "token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              sys: { id: "meditation-1" },
              fields: {
                title: "Guided meditation",
                slug: "guided-meditation",
                subcategoryKey: "Guided Meditation",
                muxPlaybackId: "playback-1",
                packageRequired: "plus",
                durationMinutes: 10,
              },
            },
          ],
        }),
      }),
    );

    const [item] = await getMeditationRelaxationItems("en");

    expect(item).toMatchObject({
      slug: "guided-meditation",
      subcategoryKey: "guided-meditation",
      packageRequired: "plus",
      durationMinutes: 10,
    });
  });
});

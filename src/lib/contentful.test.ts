import { BLOCKS } from "@contentful/rich-text-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBlogPosts } from "./contentful";

function mockBlogResponse(body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [{
        sys: { id: "post-1" },
        fields: {
          title: "Test post",
          slug: "test-post",
          body,
        },
      }],
    }),
  }));
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

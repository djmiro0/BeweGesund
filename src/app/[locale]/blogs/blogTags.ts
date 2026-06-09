import type { BlogTag } from "@/lib/contentful";

export const blogTagOptions: Array<"all" | BlogTag> = ["all", "nutrition", "health", "training"];

export function getBlogTagLabel(
  tag: "all" | BlogTag,
  t: (key: string) => string,
) {
  return t(`tags.${tag}`);
}

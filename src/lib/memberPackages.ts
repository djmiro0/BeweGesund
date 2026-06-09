import type { MemberPackage } from "@/data";

export const memberPackages: MemberPackage[] = ["starter", "rehab-plus", "all-access"];

export const packageRank: Record<MemberPackage, number> = {
  starter: 1,
  "rehab-plus": 2,
  "all-access": 3,
};

export function isMemberPackage(value: unknown): value is MemberPackage {
  return typeof value === "string" && memberPackages.includes(value as MemberPackage);
}

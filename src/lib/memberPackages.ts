import type { MemberPackage } from "@/data";

export const memberPackages: MemberPackage[] = ["basic", "plus"];

export const packageRank: Record<MemberPackage, number> = {
  basic: 1,
  plus: 2,
};

export function isMemberPackage(value: unknown): value is MemberPackage {
  return typeof value === "string" && memberPackages.includes(value as MemberPackage);
}

export function normalizeMemberPackage(value: unknown): MemberPackage {
  if (value === "plus" || value === "rehab-plus" || value === "all-access") {
    return "plus";
  }

  return "basic";
}

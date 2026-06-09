import { describe, expect, it } from "vitest";
import { normalizeMemberPackage, packageRank } from "./memberPackages";

describe("member packages", () => {
  it("normalizes legacy packages without losing paid access", () => {
    expect(normalizeMemberPackage("starter")).toBe("basic");
    expect(normalizeMemberPackage("rehab-plus")).toBe("plus");
    expect(normalizeMemberPackage("all-access")).toBe("plus");
  });

  it("keeps Plus above Basic for access checks", () => {
    expect(packageRank.plus).toBeGreaterThan(packageRank.basic);
  });
});

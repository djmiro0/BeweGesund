import { describe, expect, it } from "vitest";
import { getAuthUserPhotoURL } from "./userProfile";

describe("getAuthUserPhotoURL", () => {
  it("uses the Firebase auth photo URL first", () => {
    expect(getAuthUserPhotoURL({
      photoURL: "https://auth.example/avatar.jpg",
      providerData: [{ photoURL: "https://google.example/avatar.jpg" }],
    })).toBe("https://auth.example/avatar.jpg");
  });

  it("falls back to the provider photo when the auth photo is missing", () => {
    expect(getAuthUserPhotoURL({
      photoURL: null,
      providerData: [{ photoURL: "https://google.example/avatar.jpg" }],
    })).toBe("https://google.example/avatar.jpg");
  });

  it("falls back to the provider photo when the auth photo is blank", () => {
    expect(getAuthUserPhotoURL({
      photoURL: "",
      providerData: [{ photoURL: "https://google.example/avatar.jpg" }],
    })).toBe("https://google.example/avatar.jpg");
  });

  it("returns null when no auth or provider photo exists", () => {
    expect(getAuthUserPhotoURL({
      photoURL: null,
      providerData: [{ photoURL: null }],
    })).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { inferResourceIconId, isGithubUrl } from "./tloz-icon-catalog";

describe("resource icon inference", () => {
  it("recognizes only GitHub hostnames and gives GitHub automatic priority", () => {
    expect(isGithubUrl("https://github.com/ZIVELO-MX/zipform")).toBe(true);
    expect(isGithubUrl("https://www.github.com/ZIVELO-MX/zipform")).toBe(true);
    expect(isGithubUrl("https://github.com.evil.test/repo")).toBe(false);
    expect(inferResourceIconId({ type: "document", url: "https://github.com/org/repo" })).toBe("Github");
  });

  it("keeps a manually selected icon ahead of URL and type inference", () => {
    expect(inferResourceIconId({ type: "link", url: "https://github.com/org/repo", icon: "Database" })).toBe("Database");
    expect(inferResourceIconId({ type: "image" })).toBe("Image");
  });
});

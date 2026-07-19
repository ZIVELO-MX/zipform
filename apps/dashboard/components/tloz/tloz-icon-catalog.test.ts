import { describe, expect, it } from "vitest";
import { inferResourceIconId, isGithubUrl, resolveResourceImageUrl, resourceUsesFileId } from "./tloz-icon-catalog";

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

  it("resolves current and legacy image URLs without treating file IDs as URLs", () => {
    expect(resolveResourceImageUrl({ type: "image", url: " https://images.test/current.png " })).toBe("https://images.test/current.png");
    expect(resolveResourceImageUrl({ type: "image", fileId: "https://images.test/legacy.png" })).toBe("https://images.test/legacy.png");
    expect(resolveResourceImageUrl({ type: "image", fileId: "asset-123" })).toBeUndefined();
    expect(resolveResourceImageUrl({ type: "file", url: "https://images.test/file.png" })).toBeUndefined();
  });

  it("stores image locations as URLs instead of file IDs", () => {
    expect(resourceUsesFileId("image")).toBe(false);
    expect(resourceUsesFileId("file")).toBe(true);
    expect(resourceUsesFileId("document")).toBe(true);
  });
});

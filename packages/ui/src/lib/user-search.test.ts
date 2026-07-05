import { describe, expect, it } from "vitest";
import { matchesUserSearch, normalizeUserSearch } from "./user-search";

describe("user search", () => {
  it("normalizes casing and diacritics", () => {
    expect(normalizeUserSearch("Raúl Hernández")).toBe("raul hernandez");
  });

  it("matches an unaccented query against an accented user", () => {
    expect(matchesUserSearch({ id: "raul", name: "Raúl Hernández", username: "Raúl" }, "raul")).toBe(true);
  });

  it("returns false when neither name nor username matches", () => {
    expect(matchesUserSearch({ id: "benji", name: "Benji Rodriguez", username: "benrod" }, "raul")).toBe(false);
  });
});

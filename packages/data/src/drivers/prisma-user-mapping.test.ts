import { describe, expect, it } from "vitest";
import { mapUser } from "./prisma";

describe("Prisma user mapping", () => {
  it("returns only public profile fields", () => {
    const databaseUser = {
      id: "user-1",
      name: "Ada",
      username: "ada",
      email: "ada@example.com",
      role: "Platform Owner",
      type: "human",
      avatarUrl: "https://example.com/ada.png",
      theme: "dark",
      passwordHash: "must-not-leak",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const profile = mapUser(databaseUser);

    expect(profile).toEqual({
      id: "user-1",
      name: "Ada",
      username: "ada",
      email: "ada@example.com",
      role: "Platform Owner",
      type: "human",
      avatarUrl: "https://example.com/ada.png",
      theme: "dark",
    });
    expect(profile).not.toHaveProperty("passwordHash");
    expect(profile).not.toHaveProperty("createdAt");
  });
});

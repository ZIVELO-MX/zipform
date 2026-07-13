import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mission status selector", () => {
  it("keeps the Radix value anchor required by item-aligned content", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");

    expect(source).toMatch(
      /<SelectTrigger aria-label="Estado"><SelectValue><StatusValue status=\{status\} \/><\/SelectValue><\/SelectTrigger><SelectContent position="item-aligned">/,
    );
  });
});

import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/openapi", () => {
  it("returns YAML by default with cache and timing headers", async () => {
    const response = await GET(new Request("https://zipform.test/api/openapi"));
    expect(response.headers.get("content-type")).toContain("text/yaml");
    expect(response.headers.get("vary")).toBe("Accept");
    expect(response.headers.get("server-timing")).toMatch(/^openapi;dur=/);
  });

  it("negotiates JSON and rejects unsupported formats", async () => {
    const json = await GET(new Request("https://zipform.test/api/openapi", { headers: { Accept: "application/json" } }));
    expect(json.headers.get("content-type")).toContain("application/json");
    expect((await json.json())).toMatchObject({ openapi: "3.1.0" });

    const unsupported = await GET(new Request("https://zipform.test/api/openapi", { headers: { Accept: "text/html" } }));
    expect(unsupported.status).toBe(406);
  });
});

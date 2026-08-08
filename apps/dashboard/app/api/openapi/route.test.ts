import { describe, expect, it } from "vitest";
import { GET } from "./route";

const url = "https://zipform.test/api/openapi";

describe("GET /api/openapi", () => {
  it("returns YAML by default with cache and timing headers", async () => {
    const response = await GET(new Request(url));
    expect(response.headers.get("content-type")).toContain("text/yaml");
    expect(response.headers.get("vary")).toBe("Accept");
    expect(response.headers.get("cache-control")).toContain("max-age");
    expect(response.headers.get("etag")).toMatch(/^".+"$/);
    expect(response.headers.get("server-timing")).toMatch(/^openapi;dur=/);
  });

  it("negotiates JSON and rejects unsupported formats", async () => {
    const json = await GET(new Request(url, { headers: { Accept: "application/json" } }));
    expect(json.headers.get("content-type")).toContain("application/json");
    expect((await json.json())).toMatchObject({ openapi: "3.1.0" });

    const unsupported = await GET(new Request(url, { headers: { Accept: "text/html" } }));
    expect(unsupported.status).toBe(406);
    expect(unsupported.headers.get("vary")).toBe("Accept");
  });

  it("exposes distinct strong ETags per representation", async () => {
    const yaml = await GET(new Request(url));
    const json = await GET(new Request(url, { headers: { Accept: "application/json" } }));
    const yamlEtag = yaml.headers.get("etag");
    const jsonEtag = json.headers.get("etag");
    expect(yamlEtag).toBeTruthy();
    expect(jsonEtag).toBeTruthy();
    expect(yamlEtag).not.toBe(jsonEtag);
    // Stable across calls (memoized contract).
    const yamlAgain = await GET(new Request(url));
    expect(yamlAgain.headers.get("etag")).toBe(yamlEtag);
  });

  it("answers 304 to a matching If-None-Match without a body", async () => {
    const first = await GET(new Request(url, { headers: { Accept: "application/json" } }));
    const etag = first.headers.get("etag")!;
    const revalidated = await GET(new Request(url, { headers: { Accept: "application/json", "If-None-Match": etag } }));
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get("etag")).toBe(etag);
    expect(await revalidated.text()).toBe("");
  });
});

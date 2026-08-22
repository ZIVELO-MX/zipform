import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { parse } from "yaml";

function findSpec(): string {
  const candidates = [
    join(process.cwd(), "docs", "api", "openapi.yaml"),
    join(process.cwd(), "..", "docs", "api", "openapi.yaml"),
    join(process.cwd(), "..", "..", "docs", "api", "openapi.yaml"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(`openapi.yaml not found — tried: ${candidates.join(", ")}`);
}

type SpecCache = { yamlText: string; jsonText: string; etagYaml: string; etagJson: string };

let specCache: SpecCache | null = null;

function strongEtag(body: string): string {
  return `"${createHash("sha256").update(body).digest("base64url")}"`;
}

// Read the file and parse the YAML once per server process. The contract is a
// build-time artifact, so every later request serves memoized bytes with no fs
// read and no YAML parse — the JSON body is pre-serialized too.
function loadSpec(): { cache: SpecCache; hit: boolean } {
  if (specCache) return { cache: specCache, hit: true };
  const yamlText = readFileSync(findSpec(), "utf-8");
  const jsonText = JSON.stringify(parse(yamlText));
  specCache = { yamlText, jsonText, etagYaml: strongEtag(yamlText), etagJson: strongEtag(jsonText) };
  return { cache: specCache, hit: false };
}

function matchesEtag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch.split(",").map((value) => value.trim()).some((value) => value === "*" || value === etag);
}

export async function GET(request: Request) {
  const startedAt = performance.now();
  try {
    const { cache, hit } = loadSpec();
    const accept = request.headers.get("accept") ?? "text/yaml";
    const wantsJson = accept.includes("application/json");
    const wantsYaml = accept.includes("text/yaml") || accept.includes("application/yaml") || accept.includes("*/*");
    const timing = () => `openapi;dur=${(performance.now() - startedAt).toFixed(2)}, cache;desc=${hit ? "hit" : "miss"}`;

    if (!wantsJson && !wantsYaml) {
      return NextResponse.json(
        { error: { code: "NOT_ACCEPTABLE", message: "Usa Accept: text/yaml o application/json.", requestId: crypto.randomUUID() } },
        { status: 406, headers: { "Cache-Control": "public, max-age=300", Vary: "Accept", "Server-Timing": timing() } },
      );
    }

    const etag = wantsJson ? cache.etagJson : cache.etagYaml;
    const headers: Record<string, string> = {
      "Cache-Control": "public, max-age=300",
      Vary: "Accept",
      ETag: etag,
      "Server-Timing": timing(),
    };

    if (matchesEtag(request.headers.get("if-none-match"), etag)) {
      return new NextResponse(null, { status: 304, headers });
    }
    if (wantsJson) {
      return new NextResponse(cache.jsonText, { headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
    }
    return new NextResponse(cache.yamlText, { headers: { ...headers, "Content-Type": "text/yaml; charset=utf-8" } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message, requestId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}

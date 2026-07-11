import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
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

export async function GET(request: Request) {
  const startedAt = performance.now();
  try {
    const specPath = findSpec();
    const spec = readFileSync(specPath, "utf-8");
    const accept = request.headers.get("accept") ?? "text/yaml";
    const headers = {
      "Cache-Control": "public, max-age=300",
      "Vary": "Accept",
      "Server-Timing": `openapi;dur=${(performance.now() - startedAt).toFixed(2)}`,
    };
    if (accept.includes("application/json")) {
      return NextResponse.json(parse(spec), { headers });
    }
    if (!accept.includes("text/yaml") && !accept.includes("application/yaml") && !accept.includes("*/*")) {
      return NextResponse.json(
        { error: { code: "NOT_ACCEPTABLE", message: "Usa Accept: text/yaml o application/json.", requestId: crypto.randomUUID() } },
        { status: 406, headers },
      );
    }
    return new NextResponse(spec, {
      headers: {
        ...headers,
        "Content-Type": "text/yaml; charset=utf-8",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message, requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

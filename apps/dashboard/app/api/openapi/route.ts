import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

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

export async function GET() {
  try {
    const specPath = findSpec();
    const spec = readFileSync(specPath, "utf-8");
    return new NextResponse(spec, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message, requestId: crypto.randomUUID() } },
      { status: 500 }
    );
  }
}

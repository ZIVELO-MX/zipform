import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  const specPath = join(process.cwd(), "docs", "api", "openapi.yaml");
  const spec = readFileSync(specPath, "utf-8");
  return new NextResponse(spec, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

import { PaginationCursorError } from "@tloz/data";
import { NextResponse } from "next/server";

export function paginationErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof PaginationCursorError)) return null;
  return NextResponse.json({
    error: {
      code: "INVALID_REQUEST",
      message: error.message,
      fields: { cursor: "invalid" },
      requestId: crypto.randomUUID(),
    },
  }, { status: 400 });
}

export function parsePaginationLimit(value: unknown): number | NextResponse {
  if (value === undefined || value === null || value === "") return 25;
  const limit = Number(value);
  if (Number.isInteger(limit) && limit >= 1 && limit <= 100) return limit;
  return NextResponse.json({
    error: {
      code: "INVALID_REQUEST",
      message: "limit debe ser un entero entre 1 y 100.",
      fields: { limit: "invalid" },
      requestId: crypto.randomUUID(),
    },
  }, { status: 400 });
}

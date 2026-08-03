import { NextResponse } from "next/server";

type ReadTelemetry = {
  request: Request;
  actorId: string;
  operation: string;
  payload: unknown;
  startedAt: number;
  status?: number;
};

export function observedJson({ request, actorId, operation, payload, startedAt, status = 200 }: ReadTelemetry) {
  const body = JSON.stringify(payload);
  const requestId = crypto.randomUUID();
  const client = request.headers.get("x-tloz-client") ?? request.headers.get("user-agent") ?? "unknown";
  console.info(JSON.stringify({
    event: "api_read",
    requestId,
    route: new URL(request.url).pathname,
    operation,
    actorId,
    client: client.slice(0, 120),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    responseBytes: new TextEncoder().encode(body).byteLength,
    durationMs: Math.round(performance.now() - startedAt),
    status,
  }));
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
  });
}

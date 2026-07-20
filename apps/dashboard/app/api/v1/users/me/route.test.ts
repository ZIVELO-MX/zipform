import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { GET } from "./route";

vi.mock("../../../../../lib/api-auth", () => ({
  authenticateRequest: vi.fn(),
}));

const mockedAuthenticateRequest = vi.mocked(authenticateRequest);

describe("GET /api/v1/users/me", () => {
  beforeEach(() => {
    mockedAuthenticateRequest.mockReset();
  });

  it("returns the authenticated public profile", async () => {
    mockedAuthenticateRequest.mockResolvedValue({
      user: {
        id: "agent-1",
        name: "Zibot",
        username: "zibot",
        email: "zibot@zipform.dev",
        role: "agent:operative",
        type: "agent",
        avatarUrl: "",
        theme: "system",
      },
    });

    const response = await GET(new NextRequest("https://zipform.test/api/v1/users/me"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: expect.objectContaining({ id: "agent-1", username: "zibot" }),
    });
  });

  it("preserves the shared unauthorized response", async () => {
    mockedAuthenticateRequest.mockResolvedValue(NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required", requestId: "request-1" } },
      { status: 401 },
    ));

    const response = await GET(new NextRequest("https://zipform.test/api/v1/users/me"));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("does not expose the reader agent email", async () => {
    mockedAuthenticateRequest.mockResolvedValue({
      user: {
        id: "zileo-1",
        name: "Zileo",
        username: "zileo",
        email: "zileo@zivelo.dev",
        role: "agent:reader",
        type: "agent",
        avatarUrl: "",
        theme: "system",
      },
    });

    const response = await GET(new NextRequest("https://zipform.test/api/v1/users/me"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({ id: "zileo-1", username: "zileo", role: "agent:reader" });
    expect(body.data).not.toHaveProperty("email");
  });
});

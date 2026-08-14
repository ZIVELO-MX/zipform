import { describe, expect, it } from "vitest";
import type { TlozResource } from "@tloz/types";
import { attachmentGroupFallbackName, groupMissionResources } from "./mission-resource-groups";

function resource(id: string, input: Partial<TlozResource> = {}): TlozResource {
  return {
    id,
    type: "image",
    title: id,
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
    ...input,
  };
}

describe("Mission resource groups", () => {
  it("uses the client-defined name and emits one item per group", () => {
    const grouped = groupMissionResources([
      resource("desktop", { groupKey: "checkout-final", groupName: "Checkout responsive" }),
      resource("mobile", { groupKey: "checkout-final", groupName: "Checkout responsive" }),
      resource("brief", { type: "document" }),
    ]);

    expect(grouped.groups).toEqual([{ groupKey: "checkout-final", groupName: "Checkout responsive", resources: expect.any(Array) }]);
    expect(grouped.groups[0]?.resources).toHaveLength(2);
    expect(grouped.standalone.map((item) => item.id)).toEqual(["brief"]);
  });

  it("keeps legacy group keys readable without inventing metadata", () => {
    expect(attachmentGroupFallbackName("checkout_mobile.final")).toBe("Checkout mobile final");
    expect(groupMissionResources([resource("legacy", { groupKey: "api-captures" })]).groups[0]?.groupName).toBe("Api captures");
  });
});

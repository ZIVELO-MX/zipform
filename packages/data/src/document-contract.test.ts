import { describe, expect, it } from "vitest";
import {
  defaultInventoryFields,
  defaultMissionFields,
  validateDocumentProperties,
} from "./document-contract";
import { TlozDocumentError } from "./document-errors";

describe("validateDocumentProperties project enums", () => {
  it("accepts a known project status", () => {
    expect(() => validateDocumentProperties([], { status: "active" }, "project")).not.toThrow();
  });

  it("rejects an unknown project status", () => {
    expect(() => validateDocumentProperties([], { status: "on-hold" }, "project")).toThrow(TlozDocumentError);
  });

  it("accepts a known project category", () => {
    expect(() => validateDocumentProperties([], { category: "system" }, "project")).not.toThrow();
  });

  it("rejects an unknown project category", () => {
    expect(() => validateDocumentProperties([], { category: "portfolio" }, "project")).toThrow(TlozDocumentError);
  });

  it("keeps validating mission status through its select contract", () => {
    expect(() => validateDocumentProperties(defaultMissionFields("project-1"), { status: "now" }, "mission")).not.toThrow();
    expect(() => validateDocumentProperties(defaultMissionFields("project-1"), { status: "archived" }, "mission")).toThrow(TlozDocumentError);
  });

  it("keeps validating inventory category through its select contract", () => {
    expect(() => validateDocumentProperties(defaultInventoryFields("project-1"), { category: "tool" }, "inventory")).not.toThrow();
    expect(() => validateDocumentProperties(defaultInventoryFields("project-1"), { category: "gadget" }, "inventory")).toThrow(TlozDocumentError);
  });
});

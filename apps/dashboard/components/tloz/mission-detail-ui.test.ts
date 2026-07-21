import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const detail = readFileSync(new URL("./mission-detail.tsx", import.meta.url), "utf8");
const editor = readFileSync(new URL("./markdown-editor.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const utils = readFileSync(new URL("./tloz-utils.ts", import.meta.url), "utf8");
const attachmentUploader = readFileSync(new URL("./mission-attachment-uploader.tsx", import.meta.url), "utf8");
const attachmentClient = readFileSync(new URL("../../lib/tloz-attachments-client.ts", import.meta.url), "utf8");

describe("mission detail interaction contracts", () => {
  it("keeps Description, Detail, and Checklist open by default in left-icon accordions", () => {
    expect(detail).toContain('const defaultMissionContentSections = ["description", "detail", "checklist"]');
    expect(detail).toContain('value="description"');
    expect(detail).toContain('value="detail"');
    expect(detail).toContain('value="checklist"');
    expect(detail.match(/iconPosition="start"/g)).toHaveLength(3);
    expect(detail).toContain("showHeader={false}");
  });

  it("animates checklist filtering while respecting reduced motion", () => {
    expect(detail).toContain('key={checklistFilter} className="mission-checklist-filter');
    expect(styles).toContain("@keyframes mission-checklist-filter-in");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps a large Markdown textarea and removes the fake visual editor", () => {
    expect(editor).toContain("min-h-[45dvh]");
    expect(editor).toContain("md:min-h-80");
    expect(editor).not.toContain("contentEditable");
    expect(editor).not.toContain('label: "Visual"');
  });

  it("uses TLOZ red for completed state tokens and badges", () => {
    expect(utils).toMatch(/completed: "#D72228"/);
    expect(detail).toContain('bg-[#FDECEC] text-[#B91C22]');
  });

  it("keeps AddResource responsive and captures a manual icon", () => {
    expect(detail).toContain("flex min-w-0 flex-col gap-2 rounded-xl");
    expect(detail).toContain("sm:grid-cols-[40px_130px_minmax(0,1fr)]");
    expect(detail).toContain("...(icon ? { icon } : {})");
    expect(detail).not.toContain("sm:grid-cols-[140px_1fr_1fr_auto_auto]");
  });

  it("labels the checklist title action as Editar", () => {
    expect(detail).toContain('<Pencil className="size-3.5" />Editar');
    expect(detail).not.toContain('<Pencil className="size-3.5" />Renombrar');
  });

  it("exposes an accessible multiple attachment input and per-file recovery", () => {
    expect(attachmentUploader).toContain('type="file"');
    expect(attachmentUploader).toContain("multiple");
    expect(attachmentUploader).toContain("accept=\"image/png,image/jpeg,image/webp\"");
    expect(attachmentUploader).toContain("aria-describedby=\"mission-attachment-help\"");
    expect(attachmentUploader).toContain('aria-live="polite"');
    expect(attachmentUploader).toContain("Reintentar fallos");
    expect(attachmentUploader).toContain("Reemplazar");
  });

  it("keeps the attachment uploader hidden while API-created groups render in Resources", () => {
    expect(detail).toContain("MISSION_ATTACHMENT_UPLOAD_UI_ENABLED = false");
    expect(detail).toContain("MissionAttachmentGroupReference");
    expect(detail).toContain("Grupo de capturas");
    expect(detail).not.toContain('resources={current.resources.filter((resource) => !resource.groupKey)}');
  });

  it("keeps attachment limits and signed URL handling in the client contract", () => {
    expect(attachmentClient).toContain("MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024");
    expect(attachmentClient).toContain("MAX_ATTACHMENT_COUNT = 20");
    expect(attachmentClient).toContain('credentials: "same-origin"');
    expect(attachmentClient).toContain('credentials: "omit"');
    expect(attachmentClient).not.toContain("ZIPFORM_TOKEN");
  });
});
